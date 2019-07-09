import Chart from "../../chart.js";

d3.csv('./data.csv', function(d){
    return {
        date: d.date,
        money: +d.money
    };
}).then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        barPadding: 0.3,
        barColor: chart._colors(0),
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        gridColor: 'gray',
        tickShowGrid: [60, 120, 180],
        title: '横向直方图',
        hoverColor: 'white',
        animateDuration: 1000
    }

    chart.margins(config.margins);
    
    /* ----------------------------尺度转换------------------------  */
    chart.scaleX = d3.scaleBand()
                    .domain(data.map((d) => d.date))
                    .range([chart.getBodyHeight(), 0])
                    .padding(config.barPadding);
    
    chart.scaleY = d3.scaleLinear()
                    .domain([0, d3.max(data, (d) => d.money)])
                    .range([0, chart.getBodyWidth()])
    
    /* ----------------------------渲染柱形------------------------  */
    chart.renderBars = function(){
        let bars = chart.body().selectAll('.bar')
                    .data(data);

            bars.enter()
                    .append('rect')
                    .attr('class','bar')
                .merge(bars)
                    .attr('x', chart.scaleY(0))
                    .attr('y', (d) => chart.scaleX(d.date))
                    .attr('height', chart.scaleX.bandwidth())
                    .attr('fill', config.barColor)
                    .attr('width', 0)
                    .transition().duration(config.animateDuration)
                    .attr('width', (d) => chart.scaleY(d.money))
            
            bars.exit()
                    .remove();
    }

    /* ----------------------------渲染坐标轴------------------------  */
    chart.renderX = function(){
        chart.svg().insert('g','.body')
                .attr('transform', 'translate(' + chart.bodyX() + ',' + chart.bodyY() + ')')
                .attr('class', 'xAxis')
                .call(d3.axisLeft(chart.scaleX));
    }

    chart.renderY = function(){
        chart.svg().insert('g','.body')
                .attr('transform', 'translate(' + chart.bodyX() + ',' + (chart.bodyY() + chart.getBodyHeight()) + ')')
                .attr('class', 'yAxis')
                .call(d3.axisBottom(chart.scaleY));
    }

    chart.renderAxis = function(){
        chart.renderX();
        chart.renderY();
    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){
        d3.select('.xAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('fill', config.textColor)
                            .attr('dx', -20)
                            .text('日期');

        d3.select('.yAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', chart.getBodyWidth())
                            .attr('y', 0)
                            .attr('fill', config.textColor)
                            .attr('dy', 40)
                            .attr('text-anchor','middle')
                            .text('每日收入（元）');
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

        d3.selectAll('.bar')
            .on('mouseover', function(d){
                const e = d3.event;
                const position = d3.mouse(chart.svg().node());

                d3.select(e.target)
                    .attr('fill', config.hoverColor);
                
                chart.svg()
                    .append('text')
                    .classed('tip', true)
                    .attr('x', position[0]+5)
                    .attr('y', position[1])
                    .attr('fill', config.textColor)
                    .text('收入:' + d.money + '元');
            })
            .on('mouseleave', function(){
                const e = d3.event;
                
                d3.select(e.target)
                    .attr('fill', chart._colors(0));
                    
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

        chart.renderBars();

        chart.renderGrid();

        chart.addMouseOn();

        chart.renderTitle();
    }

    chart.renderChart();
    
        
});














