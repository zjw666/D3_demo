import Chart from "../../chart.js";

d3.csv('./data.csv', function(d){
    return {
        action: d.action,
        number: +d.number
    };
}).then(function(data){
    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        title: '基础漏斗图',
        animateDuration: 1000,
        trapezoidPadding: 3,
        hoverColor: 'white',
    }

    chart.margins(config.margins);

    const trapezoidsHeight = (chart.getBodyHeight() - config.trapezoidPadding * (data.length -1)) / data.length;
    
    /* ----------------------------尺度转换------------------------  */
    chart.scale = d3.scaleLinear()
                        .domain([0, d3.max(data, (d) => d.number)])
                        .range([0, chart.getBodyWidth()*0.8]);
    
    /* ----------------------------数据处理------------------------  */
    const handleData = data.sort((a,b) => b.number - a.number).map(
        (d,i,array) => {
            if (i !== array.length-1){
                d.nextNum = array[i+1].number;
            }else{
                d.nextNum = 0;
            }
            return d;
        }
    );

    /* ----------------------------渲染梯形------------------------  */
    chart.renderTrapezoid = function(){

        let trapezoids = chart.body()
                                .append('g')
                                .attr('class', 'traps')
                                .attr('transform', 'translate(' + chart.getBodyWidth()/2 + ',0)')
                                .selectAll('.trap')
                                .data(handleData);
            
            trapezoids.enter()
                        .append('polygon')
                        .attr('class', (d,i) => 'trap + trap-' + i)
                      .merge(trapezoids)
                        .attr('points', (d) => getPoints(chart.scale(d.number), chart.scale(d.nextNum), trapezoidsHeight))
                        .attr('transform', (d,i) => 'translate(0,' + i*(config.trapezoidPadding + trapezoidsHeight) + ')')
                        .attr('fill', (d,i) => chart._colors(i))

            trapezoids.exit()
                        .remove();
                                          

        //计算梯形的点坐标
        function getPoints(topWidth, bottomWidth, height){
            const points = [];

            points.push(-topWidth/2 + ',' + 0);
            points.push(topWidth/2 + ',' + 0);

            if (bottomWidth === 0){
                points.push(0 + ',' + height);
            }else{
                points.push(bottomWidth/2 + ',' + height);
                points.push(-bottomWidth/2 + ',' + height);
            }
            
            return points.join(" ");
        }
    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){
        let texts = d3.select('.traps')
                            .selectAll('.label')
                            .data(handleData);
            
              texts.enter()
                     .append('text')
                     .attr('class','label')
                   .merge(texts)
                     .text((d) => d.action)
                     .attr('text-anchor', 'middle')
                     .attr('x', 0)
                     .attr('y', (d,i) => i * (config.trapezoidPadding + trapezoidsHeight) + trapezoidsHeight/2)
                     .attr('stroke', config.textColor);

              texts.exit()
                     .remove();
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

        d3.selectAll('.trap')
            .on('mouseover', function(){
                const e = d3.event;

                d3.select(e.target)
                    .attr('fill', config.hoverColor);
            })
            .on('mouseleave', function(d,i){
                const e = d3.event;

                d3.select(e.target)
                    .attr('fill', chart._colors(i));
            })
    }
        
    chart.render = function(){

        chart.renderTitle();

        chart.renderTrapezoid();

        chart.renderText();

        chart.addMouseOn();

    }

    chart.renderChart();
    
        
});














