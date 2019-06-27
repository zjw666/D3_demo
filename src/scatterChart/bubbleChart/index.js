import Chart from "../../chart.js";

d3.csv('./data.csv', function(d){
    return {
        x: +d.x,
        y: +d.y,
        r: +d.size
    };
}).then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        gridColor: 'gray',
        ShowGridX: [10, 20, 30, 40, 50, 60, 70 ,80, 90, 100],
        ShowGridY: [10, 20, 30, 40, 50, 60, 70 ,80, 90, 100],
        title: '气泡图',
        pointMaxSize: 20,
        hoverColor: 'white',
        animateDuration: 1000,
        pointCenterColor: 'white',
        pointEdgeColor: chart._colors(0)
    }

    chart.margins(config.margins);
    
    /* ----------------------------尺度转换------------------------  */
    chart.scaleX = d3.scaleLinear()
                    .domain([0, Math.ceil(d3.max(data, (d) => d.x)/10)*10])
                    .range([0, chart.getBodyWidth()]);
    
    chart.scaleY = d3.scaleLinear()
                    .domain([0, Math.ceil(d3.max(data, (d) => d.y)/10)*10])
                    .range([chart.getBodyHeight(), 0]);
    
    chart.scaleSize = d3.scaleLinear()
                        .domain([0, d3.max(data, (d) => d.r)])
                        .range([0, config.pointMaxSize]);
    
    
    
    /* ----------------------------渲染数据点------------------------  */
    chart.renderPoints = function(){
        let points = chart.body().selectAll('.point')
                    .data(data);

            points.enter()
                    .append('circle')
                    .classed('point', true)
                .merge(points)
                    .attr('cx', (d) => chart.scaleX(d.x))
                    .attr('cy', (d) => chart.scaleY(d.y))
                    .attr('r', 0)
                    .attr('fill', 'url(#bubble-fill)')
                    .transition().duration(config.animateDuration)
                    .attr('r', (d) => chart.scaleSize(d.r));
            
            points.exit()
                    .remove();
    }

   /* ----------------------------定义颜色径向渐变------------------------  */
    chart.defRadialGrad = function(){
        const radialGrad = chart.svg()
                                .append('defs')
                                .append('radialGradient')
                                .attr('id', 'bubble-fill')
                                .attr('cx', 0.4)
                                .attr('cy', 0.4);


              radialGrad.append('stop')
                        .attr('offset', '0%')
                        .attr('stop-color', config.pointCenterColor);
                
              radialGrad.append('stop')
                        .attr('offset', '100%')
                        .attr('stop-color', config.pointEdgeColor);

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
                            .attr('dy', 30)
                            .text('X');

        d3.select('.yAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('fill', config.textColor)
                            .attr('dx', '-30')
                            .attr('dy', '10')
                            .text('Y');
    }

    /* ----------------------------渲染网格线------------------------  */
    chart.renderGrid = function(){
        d3.selectAll('.yAxis .tick')
            .each(function(d, i){
                if (config.ShowGridY.indexOf(d) > -1){
                    d3.select(this).append('line')
                        .attr('class','grid')
                        .attr('stroke', config.gridColor)
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', chart.getBodyWidth())
                        .attr('y2', 0);
                }
            });

        d3.selectAll('.xAxis .tick')
            .each(function(d, i){
                if (config.ShowGridX.indexOf(d) > -1){
                    d3.select(this).append('line')
                        .attr('class','grid')
                        .attr('stroke', config.gridColor)
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', 0)
                        .attr('y2', -chart.getBodyHeight());
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

        d3.selectAll('.point')
            .on('mouseover', function(d){
                const e = d3.event;
                const position = d3.mouse(chart.svg().node());
                e.target.style.cursor = 'hand'

                d3.select(e.target)
                    .attr('r', chart.scaleSize(d.r) + 5);
                
                chart.svg()
                    .append('text')
                    .classed('tip', true)
                    .attr('x', position[0]+5)
                    .attr('y', position[1])
                    .attr('fill', config.textColor)
                    .text('x: ' + d.x + ', y: ' + d.y);
            })
            .on('mouseleave', function(d){
                const e = d3.event;

                d3.select(e.target)
                    .attr('r', chart.scaleSize(d.r));
                    
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

        chart.defRadialGrad();

        chart.renderPoints();

        chart.addMouseOn();

        chart.renderTitle();
    }

    chart.renderChart();
    
        
});














