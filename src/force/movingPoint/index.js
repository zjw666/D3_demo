import Chart from "../../chart.js";


/* ----------------------------配置参数------------------------  */
const chart = new Chart();
const config = {
    margins: {top: 80, left: 80, bottom: 50, right: 80},
    title: '移动的点',
    pointSize: 5,
    animateDuration: 3000
}

chart.margins(config.margins);

const nodes = [];

/* ----------------------------建立力模型------------------------  */
const force = d3.forceSimulation()
                    .velocityDecay(0.1)  //速度衰减
                    .alphaDecay(0)       //alpha衰变, 0表示不衰减
                    .force("collision", d3.forceCollide(config.pointSize + 0.5).strength(0.1));  //以多于5的半径，0.1的强度，设置碰撞力模型

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
    let prevPoint;

    chart.svg().on("mousemove", debounce(function(){
        const point = d3.mouse(chart.body().node());

        const newNode = {
            x: point[0],
            y: point[1],
            vx: prevPoint ? (point[0] - prevPoint[0]) * 0.1 : 0,
            vy: prevPoint ? (point[1] - prevPoint[1]) * 0.1 : 0
        };

        prevPoint = point;

        chart.body().append('circle')
                    .data([newNode])
                        .attr('class', 'node')
                        .attr('cx', (d) => d.x)
                        .attr('cy', (d) => d.y)
                        .attr('fill', () => chart._colors(Math.floor(Math.random()*10)))
                        .attr('r', 1e-6)
                    .transition()
                        .attr('r', config.pointSize)
                    .transition().delay(config.animateDuration)
                        .attr('r', 1e-6)
                        .on('end', () =>{    //弹出点，并重新绑定nodes
                            nodes.shift();
                            force.nodes(nodes);
                        })
                        .remove();
        
        nodes.push(newNode);   //加入新点，重新绑定nodes
        force.nodes(nodes);
    }), 5);

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
};

/* ----------------------------绑定tick事件------------------------  */

chart.addForceTick = function(){
    force.on('tick', function(){
        chart.body().selectAll('circle')
                    .attr('cx', (d) => d.x)
                    .attr('cy', (d) => d.y);
    });
};
    
chart.render = function(){

    chart.renderTitle();

    chart.addMouseOn();

    chart.addForceTick();

}

chart.renderChart();














