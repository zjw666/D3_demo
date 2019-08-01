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
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        title: '南丁格尔图',
        innerRadius: 0,
        textOffsetH: 10,
        lineColor: 'black',
        animateDuration: 1000
    }

    chart.margins(config.margins);

    /* ----------------------------尺度转换------------------------  */
    chart.arcAngle = d3.pie()
                    .sort((d,i) => i)
                    .value((d) => d.money);

    chart.scaleRadius = d3.scaleLinear()
                            .domain([0, d3.max(data.map((d) => d.money))])
                            .range([0, d3.min([chart.getBodyWidth(), chart.getBodyHeight()]) * 0.5])

    /* ----------------------------渲染扇形------------------------  */
    chart.renderSlices = function(){
        const slices = chart.body().append('g')
                            .classed('pie', true)
                            .attr('transform', 'translate(' + chart.getBodyWidth()/2 + ',' + chart.getBodyHeight()/2 + ')')
                            .selectAll('.arc')
                            .data(chart.arcAngle(data));

              slices.enter()
                        .append('path')
                        .attr('class', (d,i) => 'arc arc-' + i)
                    .merge(slices)
                        .attr('fill', (d,i) => chart._colors(i))
                        .transition().duration(config.animateDuration)
                        .attrTween("d", arcTween)

              slices.exit()
                        .remove();

        function arcTween(d){
            let currentR = this._current;

            if (!currentR){
                currentR = 0
            }

            const interpolate = d3.interpolate(currentR, chart.scaleRadius(d.value));
            this._current = interpolate(1);   //当饼图更新时，从当前半径到新半径

            return function(t){
                let arc = d3.arc()
                        .outerRadius(interpolate(t))
                        .innerRadius(config.innerRadius);

                return arc(d);
            }
        }
    }

    /* ----------------------------渲染文本标签和线条------------------------  */
    chart.renderText = function(){

        // ----渲染文本标签-----

        const scaleTextDx = d3.scaleLinear()
                                .domain([0, Math.PI/2])
                                .range([config.textOffsetH, config.textOffsetH * 3]);

        const labels = d3.select('.pie')
                            .selectAll('.label')
                            .data(chart.arcAngle(data));

              labels.enter()
                        .append('text')
                        .classed('label', true)
                    .merge(labels)
                        .attr('stroke', config.textColor)
                        .attr('fill', config.textColor)
                        .attr('text-anchor', (d) => {
                            return (d.endAngle + d.startAngle)/2 > Math.PI ? 'end' : 'start';
                        })
                        .attr('dy', '0.35em')
                        .attr('dx', computeTextDx)
                        .transition().duration(0).delay(config.animateDuration)
                        .attr('transform', (d) => {
                            return 'translate(' + getArcCentorid(chart.scaleRadius(d.value)*2.5, d, true) + ')'
                        })
                        .text((d) => d.data.date+': '+d.data.money);

                labels.exit()
                        .remove();

        // ----渲染标签连线-----

        const points = getLinePoints();

        const generateLine = d3.line()
                                .x((d) => d[0])
                                .y((d) => d[1]);

        const  lines = d3.select('.pie')
                            .selectAll('.line')
                            .data(points);

               lines.enter()
                        .insert('path',':first-child')
                        .classed('line', true)
                    .merge(lines)
                        .transition().duration(0).delay(config.animateDuration)
                        .attr('fill', 'none')
                        .attr('stroke', config.lineColor)
                        .attr('d', generateLine);

                lines.exit()
                        .remove();

        function computeTextDx(d){                  //计算文本水平偏移
            const middleAngle = (d.endAngle + d.startAngle)/2;
            let dx = ''
            if (middleAngle < Math.PI){
                dx = scaleTextDx(Math.abs(middleAngle - Math.PI/2));
            }else{
                dx = -scaleTextDx(Math.abs(middleAngle - Math.PI*3/2));
            }
            return dx;
        }

        function getLinePoints(){                  //生成连线的点
            return chart.arcAngle(data).map((d) =>{
                const radius = chart.scaleRadius(d.value);
                const line = [];
                const tempPoint = getArcCentorid(radius * 2.5, d, true);
                const tempDx = computeTextDx(d);
                const dx = tempDx > 0 ? tempDx - config.textOffsetH : tempDx + config.textOffsetH;
                line.push(getArcCentorid(radius, d));
                line.push(tempPoint);
                line.push([tempPoint[0] + dx, tempPoint[1]]);
                return line;
            })
        }

        function getArcCentorid(outerRadius, d, averageLength){       //获取指定半径弧的中心点，并可以均一化长度
            if (averageLength) outerRadius = Math.sqrt(outerRadius*300);

            return d3.arc()
                        .outerRadius(outerRadius)
                        .innerRadius(config.innerRadius)
                        .centroid(d);
        }
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
        d3.selectAll('.arc')
            .on('mouseover', function(d){
                const e = d3.event;

                d3.select(e.target)
                    .attr('d', generateArc(chart.scaleRadius(d.value)*1.1));
            })
            .on('mouseleave', function(d){
                const e = d3.event;

                d3.select(e.target)
                    .attr('d', generateArc(chart.scaleRadius(d.value)));
            });

        function generateArc(outerRadius){
            return d3.arc()
                        .outerRadius(outerRadius)
                        .innerRadius(config.innerRadius);
        }
    }

    chart.render = function(){

        chart.renderTitle();

        chart.renderSlices();

        chart.renderText();

        chart.addMouseOn();
    }

    chart.renderChart();


});














