import Chart from "../../chart.js";

d3.csv('./data.csv', function(d){
    return {
        date: d.date,
        house: +d.house,
        food: +d.food,
        transportation: +d.transportation,
        education: +d.education,
        clothes: +d.clothes
    };
}).then(function(data){
    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        gridColor: 'gray',
        title: '基础河流图',
        animateDuration: 1000
    }

    chart.margins(config.margins);

    /* ----------------------------尺度转换------------------------  */
    chart.scaleX = d3.scaleTime()
                    .domain([new Date(data[0].date), new Date(data[data.length-1].date)])
                    .range([0, chart.getBodyWidth()]);

    chart.scaleY = d3.scaleLinear()
                    .domain([0, (Math.floor((
                        d3.max(data, (d) => d.house) +
                        d3.max(data, (d) => d.food) +
                        d3.max(data, (d) => d.education) +
                        d3.max(data, (d) => d.transportation) +
                        d3.max(data, (d) => d.clothes)
                        )/10) + 1)*10])
                    .range([chart.getBodyHeight(), 0])

    chart.stack = d3.stack()
                    .keys(['house', 'food', 'transportation', 'education', 'clothes'])
                    .order(d3.stackOrderInsideOut)
                    .offset(d3.stackOffsetWiggle);

    /* ----------------------------渲染面------------------------  */
    chart.renderArea = function(){
        const areas = chart.body().insert('g',':first-child')
                        .attr('transform', 'translate(0, -' +  d3.max(data, (d) => d3.mean(Object.values(d))) + ')')   // 使流图的位置处于Y轴中部
                        .selectAll('.area')
                        .data(chart.stack(data));

              areas.enter()
                        .append('path')
                        .attr('class', (d) => 'area area-' + d.key)
                    .merge(areas)
                        .style('fill', (d,i) => chart._colors(i))
                        .transition().duration(config.animateDuration)
                        .attrTween('d', areaTween);

        //中间帧函数
        function areaTween(_d){
            if (!_d) return;
            const generateArea = d3.area()
                        .x((d) => d[0])
                        .y0((d) => d[1])
                        .y1((d) => d[2])
                        .curve(d3.curveCardinal.tension(0));

            const pointX = data.map((d) => chart.scaleX(new Date(d.date)));
            const pointY0 = _d.map((d) => chart.scaleY(d[0]));
            const pointY1 = _d.map((d) => chart.scaleY(d[1]));

            const interpolate = getAreaInterpolate(pointX, pointY0, pointY1);

            const ponits = [];

            return function(t){
                ponits.push([interpolate.x(t), interpolate.y0(t), interpolate.y1(t)]);
                return generateArea(ponits);
            }
        }

        //点插值
        function getAreaInterpolate(pointX, pointY0, pointY1){

            const domain = d3.range(0, 1, 1/(pointX.length-1));
            domain.push(1);

            const interpolateX = d3.scaleLinear()
                                    .domain(domain)
                                    .range(pointX);

            const interpolateY0 = d3.scaleLinear()
                                    .domain(domain)
                                    .range(pointY0);

             const interpolateY1 = d3.scaleLinear()
                                    .domain(domain)
                                    .range(pointY1);
            return {
                x: interpolateX,
                y0: interpolateY0,
                y1: interpolateY1
            };

        }

    }

    /* ----------------------------渲染坐标轴------------------------  */
    chart.renderX = function(){
        chart.svg().insert('g','.body')
                .attr('transform', 'translate(' + chart.bodyX() + ',' + (chart.bodyY() + chart.getBodyHeight()) + ')')
                .attr('class', 'xAxis')
                .call(d3.axisBottom(chart.scaleX).ticks(d3.timeDay.every(3)).tickFormat((d) => d3.timeFormat("%d")(d)));
    }

    chart.renderY = function(){
        chart.svg().insert('g','.body')
                .attr('transform', 'translate(' + chart.bodyX() + ',' + chart.bodyY() + ')')
                .attr('class', 'yAxis')
                .call(d3.axisLeft(chart.scaleY));
    }

    chart.renderAxis = function(){
        chart.renderX();
        chart.renderY();
    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){
        d3.select('.xAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', chart.getBodyWidth())
                            .attr('y', 0)
                            .attr('fill', config.textColor)
                            .attr('dy', 40)
                            .text('日期');

        d3.select('.yAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('fill', config.textColor)
                            .attr('transform', 'rotate(-90)')
                            .attr('dy', -40)
                            .attr('text-anchor','end')
                            .text('每日支出（元）');
    }

    /* ----------------------------渲染网格线------------------------  */
    chart.renderGrid = function(){
        d3.selectAll('.xAxis .tick')
            .append('line')
            .attr('class','grid')
            .attr('stroke', config.gridColor)
            .attr('stroke-dasharray', '10,10')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', -chart.getBodyHeight());
    }

    /* ----------------------------渲染图标题------------------------  */
    chart.renderTitle = function(){
        chart.svg().append('text')
                .classed('title', true)
                .attr('x', chart.width()/2)
                .attr('y', 0)
                .attr('dy', '2em')
                .text(config.title)
                .attr('fill', config.textColor)
                .attr('text-anchor', 'middle')
                .attr('stroke', config.textColor);

    }

    /* ----------------------------绑定鼠标交互事件------------------------  */
    chart.addMouseOn = function(){
        //防抖函数
        function debounce(fn, time){
            let timeId = null;
            return function(){
                const context = this;
                const event = d3.event;
                timeId && clearTimeout(timeId)
                timeId = setTimeout(function(){
                    d3.event = event;
                    fn.apply(context, arguments);
                }, time);
            }
        }

        d3.selectAll('.area')
            .on('mouseover', function(d){
                const e = d3.event;
                const position = d3.mouse(chart.svg().node());
                e.target.style.cursor = 'hand'

                d3.selectAll('.area')
                    .attr('fill-opacity', 0.3);

                d3.select(e.target)
                    .attr('fill-opacity', 1);

                chart.svg()
                    .append('text')
                    .classed('tip', true)
                    .attr('x', position[0]+5)
                    .attr('y', position[1])
                    .attr('fill', config.textColor)
                    .text(d.key);
            })
            .on('mouseleave', function(){
                const e = d3.event;

                d3.selectAll('.area')
                    .attr('fill-opacity', 1);

                d3.select('.tip').remove();
            })
            .on('mousemove', debounce(function(){
                    const position = d3.mouse(chart.svg().node());
                    d3.select('.tip')
                    .attr('x', position[0]+5)
                    .attr('y', position[1]-5);
                }, 6)
            );
    }

    chart.render = function(){

        chart.renderAxis();

        chart.renderText();

        chart.renderGrid();

        chart.renderTitle();

        chart.renderArea();

        chart.addMouseOn();
    }

    chart.renderChart();


});














