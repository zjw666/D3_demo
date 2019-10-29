import Chart from "../../chart.js";

d3.csv('./data.csv', function(d){
    return {
        name: d.name,
        math: +d.math,
        chinese: +d.chinese,
        english: +d.english,
        chemistry: +d.chemistry
    };
}).then(function(data){
    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        lineColor: chart._colors(0),
        margins: {top: 80, left: 50, bottom: 50, right: 50},
        textColor: 'black',
        title: '平行坐标系折线图',
        hoverColor: 'red',
        padding: 120,
        animateDuration: 1000
    }

    chart.margins(config.margins);

    /* ----------------------------尺度转换------------------------  */
    const fields =  ['math', 'chinese', 'english', 'chemistry'];
    chart.scales = d3.zip(...(data.map((item) => d3.permute(item, fields)))).map((subject) => {
        return d3.scaleLinear()
                    .domain([0, Math.floor(d3.max(subject)/10 + 1)*10])
                    .range([chart.getBodyHeight()*0.9, 0]);
    });

    /* ----------------------------渲染线条------------------------  */
    chart.renderLines = function(){
        const lines = chart.body().append('g')
                                .attr('class', 'lines')
                                .selectAll('.line')
                                .data(data);

        const linesEnter = lines.enter()
                                .append('g')
                                .attr('class', 'line');

              linesEnter.append('path')
                            .attr('stroke', (d,i) => chart._colors(i % 10))
                            .attr('stroke-width', 2)
                            .attr('fill', 'none')
                            .attr('d', (d) => d3.line()(generatePoints(d)))

              linesEnter.append('text')
                            .attr('dx', '1em')
                            .attr('transform', (d,i) => 'translate(' + 3.5 * config.padding + ',' + chart.scales[chart.scales.length-1](d['chemistry'])+')' )
                            .text((d) => d.name)

              lines.exit()
                      .remove()

        function generatePoints(d) {
            return d3.permute(d, ['math', 'chinese', 'english', 'chemistry']).map((item, index) => {
                return [
                    (index+0.5) * config.padding,
                    chart.scales[index](item)
                ];
            });
        }

    }
    /* ----------------------------渲染坐标轴------------------------  */
    chart.renderAxis = function(){
        chart.scales.forEach((scale, index) => {
            chart.body()
                 .append('g')
                 .attr('class', 'axis axis-' + index)
                 .attr('transform', 'translate(' + (index+0.5) * config.padding + ',0)' )
                 .call(d3.axisLeft(scale).ticks(7));
        });
    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){
        data.columns.forEach((subject, index) => {
            if (index === 0) return;
            d3.select('.axis-' + (index - 1) ).append('text')
                        .attr('class', 'label label-' + (index -1))
                        .attr('transform', 'translate(0'  + ','+ chart.getBodyHeight()*0.9 + ')' )
                        .attr('stroke', config.textColor)
                        .attr('fill', config.textColor)
                        .attr('dx', '1em')
                        .attr('dy', '2em')
                        .text(subject)
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

    chart.render = function(){

        chart.renderAxis();

        chart.renderText();

        chart.renderLines();

        chart.renderTitle();

    }

    chart.renderChart();

});














