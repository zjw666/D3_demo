import Chart from "../../chart.js";


/* ----------------------------配置参数------------------------  */
const chart = new Chart();
const config = {
    margins: {top: 80, left: 80, bottom: 50, right: 80},
    title: '多彩的泡泡',
    pointSize: 5,
    animateDuration: 5000
}

chart.margins(config.margins);

const nodes = [];  //存储围成气泡的节点
const links = [];  //存储节点间的链接

/* ----------------------------建立力模型------------------------  */
const force = d3.forceSimulation()
                    .velocityDecay(0.8)  //速度衰减
                    .alphaDecay(0)       //alpha衰变, 0表示不衰减
                    .force("collision", d3.forceCollide(config.pointSize + 0.5).strength(1))  //以多于5的半径，1的强度，设置碰撞力模型
                    .force("charge", d3.forceManyBody().strength(-50).distanceMax(config.pointSize*20))  //50强度的斥力，最大有效距离为半径的20倍
                    .force("position", d3.forceY(config.pointSize*30));  //施加Y轴向下的力

const line = d3.line()
                .x((d) => d.x)
                .y((d) => d.y)
                .curve(d3.curveBasisClosed);

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

    chart.svg().on("click", function(){
        const point = d3.mouse(chart.body().node());

        const newNodes = createNodes(point);

        const newLinks = createLinks(newNodes);

        chart.body().append('path')
                    .data([newNodes])
                        .attr('class', 'bubble')
                        .attr('fill', chart._colors(Math.floor(Math.random()*10)))
                        .attr('stroke', 'white')
                        .attr('d', line)
                    .transition().delay(config.animateDuration)
                        .attr('fill-opacity', 0)
                        .attr('stroke-opacity', 0)
                        .remove();
        
        force.nodes(nodes);
        force.force('link', d3.forceLink(links).strength(1).distance(20));   //绑定链接
        force.restart();
    });

    function createNodes(point){    //生成围成气泡的节点
        const pointNum = 3 + Math.floor(Math.random()*10);   //至少3个点
        const newNodes = [];

        for (let i=0; i<pointNum; i++){
            newNodes.push([
                point[0] + Math.random() * 100 * (Math.random() < 0.5? -1 : 1),
                point[1] + Math.random() * 100 * (Math.random() < 0.5? -1 : 1)
            ]);
        }

        const hullPoints = d3.polygonHull(newNodes).map((point) => ({x: point[0], y: point[1]}));  //计算凸包

        hullPoints.forEach((node) => nodes.push(node));
        return hullPoints;
    }

    function createLinks(nodes){   //生成节点间的link
        const newLinks = [];

        for (let i=0; i<nodes.length; i++){
            if (i===nodes.length-1){
                newLinks.push({
                    source: nodes[i],
                    target: nodes[0]
                });
            }else{
                newLinks.push({
                    source: nodes[i],
                    target: nodes[i+1]
                });
            }
        }

        newLinks.forEach((link) => links.push(link));
        return newLinks;
    }

};

/* ----------------------------绑定tick事件------------------------  */

chart.addForceTick = function(){
    force.on('tick', function(){
        chart.body().selectAll('path')
                    .attr('d', line);
    });
};
    
chart.render = function(){

    chart.renderTitle();

    chart.addMouseOn();

    chart.addForceTick();

}

chart.renderChart();














