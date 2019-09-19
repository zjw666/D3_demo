import Chart from "../../chart.js";

d3.json('./data.json').then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        title: '弦图',
        hoverColor: 'white',
        innerRadius: 110,
        outerRadius: 130
    }

    chart.margins(config.margins);

    /* ----------------------------尺度转换------------------------  */
    const chord = d3.chord()
                    .padAngle(0.1)
                    .sortGroups(d3.descending)     // 环状弦排列顺序
                    .sortSubgroups(d3.descending)  // 单个环状弦内部连接弦排列顺序
                    .sortChords(d3.descending);    //连接弦上下层叠顺序

    const handleData = chord(data.population);

    /* ----------------------------渲染外环------------------------  */
    chart.renderRing = function(){
        const arc = d3.arc()
                        .innerRadius(config.innerRadius)
                        .outerRadius(config.outerRadius);

        const groups = chart.body()
                                .append('g')
                                .attr('class', 'chord')
                                .attr('transform', 'translate(' + chart.getBodyWidth()/2 + ',' + chart.getBodyHeight()/2 + ')')
                                .append('g')
                                .attr('class', 'groups')
                                .selectAll('g')
                                .data(handleData.groups);

              groups.enter()
                      .append('g')
                      .attr('class', (d) => d.index + ' g')
                      .append('path')
                      .attr('fill', (d) => chart._colors(d.index % 10))
                      .attr('stroke', (d) => d3.rgb(chart._colors(d.index % 10)).darker())
                      .attr('d', arc);
    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){
        const radius = config.outerRadius + 10;

        d3.selectAll('.g')
            .append('text')
            .attr('class', (d) => 'label ' + d.index)
            .attr('x', (d) => radius * Math.sin((d.endAngle + d.startAngle)/2))
            .attr('y', (d) => -radius * Math.cos((d.endAngle + d.startAngle)/2))
            .attr('transform', (d) => 'rotate(' + 180 * (d.endAngle + d.startAngle) / 2 / Math.PI + ',' + radius * Math.sin((d.endAngle + d.startAngle)/2) + ',' + -radius * Math.cos((d.endAngle + d.startAngle)/2) + ')')
            .attr('text-anchor', 'middle')
            .text((d) => data.citys[d.index])
    }

    /* ----------------------------渲染连线------------------------  */
    chart.renderRibbon = function(){
        const ribbon = d3.ribbon()
                            .radius(config.innerRadius);

        const ribbons = d3.select('.chord')
                            .append('g')
                            .attr('class', 'ribbons')
                            .selectAll('path')
                            .data(handleData);

              ribbons.enter()
                        .append('path')
                        .attr('class', (d) => d.source.index + '-' + d.target.index)
                        .attr('fill', (d) => d3.rgb(chart._colors(d.target.index % 10)).brighter())
                        .attr('stroke', (d) => d3.rgb(chart._colors(d.target.index % 10)).darker())
                        .attr('d', ribbon);
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
        d3.selectAll('.g')
            .on('mouseenter', function(d){
                d3.selectAll('.ribbons path')
                    .filter((link) => link.target.index !== d.index && link.source.index !== d.index)
                    .classed('show', true);
            })
            .on('mouseleave', function(){
                d3.selectAll('.ribbons path')
                    .classed('show', false);
            });

        d3.selectAll('.ribbons path')
            .on('mouseenter', function(link){
                d3.selectAll('.g')
                    .filter((d) => link.target.index !== d.index && link.source.index !== d.index)
                    .selectAll('path')
                    .classed('show', true);

                d3.selectAll('.ribbons path')
                    .filter((d) => link !== d)
                    .classed('show', true);
            })
            .on('mouseleave', function(){
                d3.selectAll('.ribbons path')
                    .classed('show', false);

                d3.selectAll('.g path')
                    .classed('show', false);
            });
    }

    chart.render = function(){

        chart.renderRing();

        chart.renderRibbon();

        chart.renderText();

        chart.addMouseOn();

        chart.renderTitle();
    }

    chart.renderChart();

});