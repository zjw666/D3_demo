d3.csv('./data.csv', function(d){
    return [
        d.date,
        +d.money
    ];
}).then(function(data){

    /* 配置参数 */
    const chart = new Chart();
    const config = {
        barPadding: 0.15,
        barColor: chart._colors(0),
        margins: {top: 50, left: 80, bottom: 50, right: 80},
        textColor: 'black'
    }

    chart.margins(config.margins);
    
    /* 尺度转换 */
    chart.scaleX = d3.scaleBand()
                    .domain(data.map((d) => d[0]))
                    .range([0, chart.getBodyWidth()])
                    .padding(config.barPadding);
    
    chart.scaleY = d3.scaleLinear()
                    .domain([0, d3.max(data, (d) => d[1])])
                    .range([chart.getBodyHeight(), 0])
    
    /* 渲染柱形 */
    chart.renderBars = function(){
        chart.body().selectAll('.bar')
                    .data(data)
                    .enter()
                    .append('rect')
                    .attr('class','bar')
                    .attr('x', (d) => chart.scaleX(d[0]))
                    .attr('y', (d) => chart.scaleY(d[1]))
                    .attr('width', chart.scaleX.bandwidth())
                    .attr('height', (d) => chart.getBodyHeight() - chart.scaleY(d[1]))
                    .attr('fill', config.barColor);
    }

    /* 渲染坐标轴 */
    chart.renderX = function(){
        chart.svg().append('g')
                .attr('transform', 'translate(' + chart.bodyX() + ',' + (chart.bodyY() + chart.getBodyHeight()) + ')')
                .attr('class', 'xAxis')
                .call(d3.axisBottom(chart.scaleX));
    }

    chart.renderY = function(){
        chart.svg().append('g')
                .attr('transform', 'translate(' + chart.bodyX() + ',' + chart.bodyY() + ')')
                .attr('class', 'yAxis')
                .call(d3.axisLeft(chart.scaleY));
    }

    chart.renderAxis = function(){
        chart.renderX();
        chart.renderY();
    }

    /* 渲染文本标签 */
    chart.renderText = function(){
        d3.select('.xAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', chart.getBodyWidth())
                            .attr('y', 0)
                            .attr('stroke', config.textColor)
                            .attr('dy', 30)
                            .text('日期');

        d3.select('.yAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('stroke', config.textColor)
                            .attr('transform', 'rotate(-90)')
                            .attr('dy', -40)
                            .attr('text-anchor','end')
                            .text('每日收入（元）');
    }
        
    chart.render = function(){
        chart.renderBars();

        chart.renderAxis();

        chart.renderText();
    }

    chart.renderChart();
    
        
});














