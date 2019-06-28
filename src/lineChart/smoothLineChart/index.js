import Chart from "../../chart.js";
import cardinalSpline from "./cardinalSpline.js";

d3.csv('./data.csv', function(d){
    return {
        date: d.date,
        money: +d.money
    };
}).then(function(data){
    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        lineColor: chart._colors(0),
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        gridColor: 'gray',
        ShowGridX: [],
        ShowGridY: [20, 40, 60, 80, 100, 120, 140, 160 ,180, 200, 220],
        title: '曲线图',
        pointSize: 5,
        pointColor: 'white',
        hoverColor: 'red',
        animateDuration: 1000
    }

    chart.margins(config.margins);
    
    /* ----------------------------尺度转换------------------------  */
    chart.scaleX = d3.scaleBand()
                    .domain(data.map((d) => d.date))
                    .range([0, chart.getBodyWidth()])
    
    chart.scaleY = d3.scaleLinear()
                    .domain([0, (Math.floor(d3.max(data, (d) => d.money)/10) + 1)*10])
                    .range([chart.getBodyHeight(), 0])
    
    /* ----------------------------渲染线条------------------------  */
    chart.renderLines = function(){

        let lines = chart.body().selectAll('.line')
                    .data([data]);

            lines.enter()
                    .append('path')
                    .classed('line', true)
                .merge(lines)
                    .attr('fill', 'none')
                    .attr('stroke', config.lineColor)
                    .attr('transform', 'translate(' + chart.scaleX.bandwidth()/2 +',0)')
                    .transition().duration(config.animateDuration)
                    .attrTween('d', lineTween);
            
            lines.exit()
                    .remove();
            
            //中间帧函数
            function lineTween(){
                const generateLine = d3.line()
                                        .x((d) => d[0])
                                        .y((d) => d[1])
                                        .curve(d3.curveCardinal.tension(0.5));

                const inputPoints = data.map((d) => ({x: chart.scaleX(d.date), y: chart.scaleY(d.money)}));

                const interpolate = getInterpolate(inputPoints);    //根据输入点集获取对应的插值函数            
                
                const outputPonits = []

                return function(t){
                    outputPonits.push(interpolate(t));
                    return generateLine(outputPonits);
                }
            }

            //点插值
            function getInterpolate(points){

                const domain = d3.range(0, 1, 1/(points.length-1));
                domain.push(1);

                const carInterpolate = cardinalSpline(points, 0.5);

                const scaleTtoX = d3.scaleLinear()   //时间t与x坐标的对应关系
                                        .domain(domain)
                                        .range(points.map((item) => item.x));

                return function(t){
                    return carInterpolate(scaleTtoX(t));
                }

            }
    }

    /* ----------------------------渲染点------------------------  */
    chart.renderPonits = function(){
        let ponits = chart.body().selectAll('.point')
                    .data(data);
            
            ponits.enter()
                    .append('circle')
                    .classed('point', true)
                .merge(ponits)
                    .attr('cx', (d) => chart.scaleX(d.date))
                    .attr('cy', (d) => chart.scaleY(d.money))
                    .attr('r', 0)
                    .attr('fill', config.pointColor)
                    .attr('stroke', config.lineColor)
                    .attr('transform', 'translate(' + chart.scaleX.bandwidth()/2 +',0)')
                    .transition().duration(config.animateDuration)
                    .attr('r', config.pointSize);
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
                            .text('日期');

        d3.select('.yAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('fill', config.textColor)
                            .attr('transform', 'rotate(-90)')
                            .attr('dy', -40)
                            .attr('text-anchor','end')
                            .text('每日收入（元）');
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
                    .attr('fill', config.hoverColor);
                
                chart.svg()
                    .append('text')
                    .classed('tip', true)
                    .attr('x', position[0]+5)
                    .attr('y', position[1])
                    .attr('fill', config.textColor)
                    .text('收入：' + d.money);
            })
            .on('mouseleave', function(){
                const e = d3.event;
                
                d3.select(e.target)
                    .attr('fill', config.pointColor);
                    
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

        chart.renderLines();

        chart.renderPonits();

        chart.renderTitle();

        chart.addMouseOn();
    }

    chart.renderChart();
    
        
});














