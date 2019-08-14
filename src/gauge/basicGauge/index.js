import Chart from "../../chart.js";

/* ----------------------------配置参数------------------------  */
const chart = new Chart();
const config = {
    margins: {top: 80, left: 80, bottom: 50, right: 80},
    textColor: 'black',
    title: '仪表盘',
    totalAngle: 270,
    totalValue: 100,
    showValue: 90,
    width: 25,
    domain: [0, 20, 80, 100],
    lineColor: 'white',
    animateDuration: 500
}

chart.margins(config.margins);

/* ----------------------------计算半径-----------------------------  */

const radius = d3.min([chart.getBodyWidth()*0.95, chart.getBodyHeight()*0.95])/2;

/* ----------------------------渲染弧形仪表盘轮廓------------------------  */
chart.renderSlices = function(){
    const drawAngles = config.domain.map((value, i, domain) => {
        const angle = value / config.totalValue * config.totalAngle;
        if (i !== domain.length-1){
            return {
                startAngle: (angle - config.totalAngle/2) * Math.PI/180,
                endAngle: (domain[i+1] / config.totalValue * config.totalAngle - config.totalAngle/2) * Math.PI/180
            }
        }
    });

    drawAngles.pop();

    const arc = d3.arc()
                    .outerRadius(radius)
                    .innerRadius(radius - config.width > 0 ? radius - config.width : 10);

    const slices = chart.body()
                        .append('g')
                        .attr('transform', 'translate(' + chart.getBodyWidth()/2 + ',' + chart.getBodyHeight()/2 + ')')
                        .selectAll('.arc')
                        .data(drawAngles);

          slices.enter()
                  .append('path')
                  .attr('class', (d,i) => 'arc arc-' + i)
               .merge(slices)
                  .attr('fill', (d,i) => chart._colors(i % 10))
                  .attr('d', arc);

          slices.exit()
                  .remove();
}

/* -----------------------渲染环形坐标轴和标签------------------------  */
chart.renderTicks = function(){
    const drawAngles = [];
    for (let i=-config.totalAngle/2; i<=config.totalAngle/2+0.01; i+=config.totalAngle/50){
        drawAngles.push(i * Math.PI/180);
    }

    const ticks = chart.body()
                        .append('g')
                        .attr('transform', 'translate(' + chart.getBodyWidth()/2 + ',' + chart.getBodyHeight()/2 + ')')
                        .selectAll('.ticks')
                        .data(drawAngles);

          ticks.enter()
                 .append('g')
                 .attr('class', 'ticks')
               .merge(ticks)
                 .each(drawTicks)
                 .each(drawLabels);

    function drawTicks(d, i){
        if (i === 0 || i === 50) return;
        const innerRadius = (i % 5===0 ? radius-config.width : radius-config.width/3)
        d3.select(this)
            .append('line')
            .attr('stroke', config.lineColor)
            .attr('x1', Math.sin(d) * radius)
            .attr('y1', -Math.cos(d) * radius)
            .attr('x2', Math.sin(d) * innerRadius)
            .attr('y2', -Math.cos(d) * innerRadius)
    }

    function drawLabels(d, i){
        let textAnchor = 'end';
        if (i === 25) textAnchor = 'middle';
        if (i % 5 === 0){
            const textRadius = radius - config.width - 10;
            d3.select(this)
                .append('text')
                .attr('class', 'label')
                .attr('x', Math.sin(d) * textRadius)
                .attr('y', -Math.cos(d) * textRadius)
                .attr('dy', 5.5)
                .attr('stroke', config.textColor)
                .attr('text-anchor', d<0?'start':textAnchor)
                .text(i/50 * config.totalValue);
        }
    }
}

/* --------------------------渲染指针--------------------------  */
chart.renderPointer = function(){
    const verticalLongOffset = Math.floor((radius-config.width-10) * 0.8);
    const verticalShortOffset = Math.floor(verticalLongOffset * 0.12);
    const horizontalOffset = Math.floor(verticalShortOffset * 0.6);

    const points = [
        "0," + verticalShortOffset,
        horizontalOffset + ",0",
        "0," + (-verticalLongOffset),
        -horizontalOffset + ",0"
    ].join(" ");

    const pointer = chart.body()
                            .selectAll(".pointer")
                            .data([config.showValue]);

          pointer.enter()
                    .append('polygon')
                    .attr('class', 'pointer')
                    .attr('points', points)
                    .attr('shape-rendering', 'geometricPrecision')
                    .attr('stroke', 'none')
                    .attr('transform', 'translate(' + chart.getBodyWidth()/2 + ',' + chart.getBodyHeight()/2 + ') ' + 'rotate(' + (-0.5)*config.totalAngle +')')
                 .merge(pointer)
                    .attr('fill', (d) => {
                        let i = 0;
                        while (i<config.domain.length-1 && config.domain[i] < d){i++}
                        return chart._colors((i-1) % 10);
                    })
                    .transition().duration(config.animateDuration)
                    .attrTween('transform', rotateTween);

          pointer.exit()
                    .remove();

    function rotateTween(d){
        let lastAngle = this.last || 0;
        let angleDiff = d - lastAngle;
        this.last = d;
        return function(t){
            return 'translate(' + chart.getBodyWidth()/2 + ',' + chart.getBodyHeight()/2 + ') ' + 'rotate(' + ((lastAngle + angleDiff*t)/config.totalValue-0.5)*config.totalAngle +')';
        }
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

chart.render = function(){

    chart.renderTitle();

    chart.renderSlices();

    chart.renderTicks();

    chart.renderPointer();
}

chart.renderChart();


setInterval(()=>{
    config.showValue = Math.random() * 100;
    chart.renderPointer();
}, 1500);













