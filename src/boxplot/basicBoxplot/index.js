import Chart from "../../chart.js";

d3.json('./data.json').then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        barPadding: 0.4,
        barStroke: 'red',
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        gridColor: 'gray',
        tickShowGrid: [200,400,600,800,1000],
        title: '基础盒须图'
    }

    chart.margins(config.margins);

    /* -----------------------数据处理，计算中位数-------------------  */
    data = data.data;

    data.forEach((item) => {
        item.values.sort((a, b) => a-b);
        item.Q1 = d3.quantile(item.values, 0.25);
        item.Q2 = d3.quantile(item.values, 0.5);
        item.Q3 = d3.quantile(item.values, 0.75);
        item.min = item.values[0];
        item.max = item.values[item.values.length-1];
    });

    /* ----------------------------尺度转换------------------------  */

    chart.scaleX = d3.scaleBand()
                    .domain(data.map((d) => d.name))
                    .range([0, chart.getBodyWidth()])
                    .padding(config.barPadding);

    chart.scaleY = d3.scaleLinear()
                    .domain([(Math.floor(d3.min(data.map((d) => d.min))/100)-1)*100, (Math.floor(d3.max(data.map((d) => d.max))/100)+1)*100])
                    .range([chart.getBodyHeight(), 0])

    /* ----------------------------渲染盒子和须----------------------  */
    chart.renderBoxs = function(){
        let groups = chart.body().selectAll('.g')
                                    .data(data);

        let groupsEnter = groups.enter()
                                  .append('g')
                                  .attr('class', 'g');

            groupsEnter.append('rect')
                         .attr('fill-opacity', '0')
                         .attr('stroke', config.barStroke);

            groupsEnter.each(function(){
                for (let i=0; i<5; i++){
                    d3.select(this).append('line')
                                    .attr('stroke', config.barStroke);
                }
            });

        let groupsUpdate = groupsEnter.merge(groups);

            groupsUpdate.selectAll('rect')      //绘制盒子矩形
                          .attr('x', (d) => chart.scaleX(d.name))
                          .attr('y', (d) => chart.scaleY(d.Q3))
                          .attr('width', chart.scaleX.bandwidth())
                          .attr('height', (d) => chart.scaleY(d.Q1) - chart.scaleY(d.Q3));

            groupsUpdate.each(function(d){       //绘制五条连接线
                let x1 = chart.scaleX(d.name);
                let x2 = x1 + chart.scaleX.bandwidth();
                let middle = (x1 + x2)/2;

                let minLine = {
                    x1: x1,
                    y1: chart.scaleY(d.min),
                    x2: x2,
                    y2: chart.scaleY(d.min)
                };

                let Q2Line = {
                    x1: x1,
                    y1: chart.scaleY(d.Q2),
                    x2: x2,
                    y2: chart.scaleY(d.Q2)
                };

                let maxLine = {
                    x1: x1,
                    y1: chart.scaleY(d.max),
                    x2: x2,
                    y2: chart.scaleY(d.max)
                };

                let linkLine1 = {
                    x1: middle,
                    y1: chart.scaleY(d.Q1),
                    x2: middle,
                    y2: chart.scaleY(d.min)
                };

                let linkLine2 = {
                    x1: middle,
                    y1: chart.scaleY(d.Q3),
                    x2: middle,
                    y2: chart.scaleY(d.max)
                };

                let lines = [minLine, Q2Line, maxLine, linkLine1, linkLine2];

                d3.select(this)
                    .selectAll('line')
                    .each(function(d,i){
                        d3.select(this)
                            .attr('x1', lines[i].x1)
                            .attr('x2', lines[i].x2)
                            .attr('y1', lines[i].y1)
                            .attr('y2', lines[i].y2);
                    });
            });

            groups.exit()
                    .remove();
    }

    /* ----------------------------渲染坐标轴------------------------  */
    chart.renderX = function(){
        chart.svg().insert('g','.body')
                .attr('transform', 'translate(' + chart.bodyX() + ',' + (chart.bodyY() + chart.getBodyHeight()) + ')')
                .attr('class', 'xAxis')
                .call(d3.axisBottom(chart.scaleX));
    }

    chart.renderY = function(){
        chart.svg().insert('g','.body')
                .attr('transform', 'translate(' + chart.bodyX() + ',' + chart.bodyY() + ')')
                .attr('class', 'yAxis')
                .call(d3.axisLeft(chart.scaleY).ticks(5));
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
                            .attr('dy', 30)
                            .text('Group');

        d3.select('.yAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('fill', config.textColor)
                            .attr('transform', 'rotate(-90)')
                            .attr('dy', -40)
                            .attr('text-anchor','end')
                            .text('Value');
    }

    /* ----------------------------渲染网格线------------------------  */
    chart.renderGrid = function(){
        d3.selectAll('.yAxis .tick')
            .each(function(d){
                if (config.tickShowGrid.indexOf(d) > -1){
                    d3.select(this).append('line')
                        .attr('class','grid')
                        .attr('stroke', config.gridColor)
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', chart.getBodyWidth())
                        .attr('y2', 0);
                }
            });
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

        d3.selectAll('.g')
            .on('mouseenter', function(d){
                const e = d3.event;
                const position = d3.mouse(chart.svg().node());
                e.target.style.cursor = 'hand';

                d3.select(e.target)
                    .attr('stroke-width', 2);

                chart.svg()
                    .append('text')
                    .classed('tip', true)
                    .attr('x', position[0]+5)
                    .attr('y', position[1])
                    .attr('fill', config.textColor)
                    .text('median: ' + d.Q2);
            })
            .on('mouseleave', function(){
                const e = d3.event;

                d3.select(e.target)
                    .attr('stroke-width', 1);

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

        chart.renderBoxs();

        chart.addMouseOn();

        chart.renderTitle();
    }

    chart.renderChart();


});














