import Chart from "../../chart.js";

d3.json('./data.json').then(function(data){

/* ----------------------------配置参数------------------------  */
const chart = new Chart();
const config = {
    margins: {top: 80, left: 80, bottom: 50, right: 80},
    title: '力导向图',
    animateDuration: 3000,
    lineColor: 'black',
    lineWidth: '1',
    pointSize: 8,
    pointStroke: 'white'
}

chart.margins(config.margins);

/* ----------------------------处理数据------------------------  */
const root = d3.hierarchy(data);

const nodes = root.descendants();

const links = root.links();

/* ----------------------------建立力模型------------------------  */
const force = d3.forceSimulation()
                    .velocityDecay(0.8)  //速度衰减
                    .alphaDecay(0)       //alpha衰变, 0表示不衰减
                    .force("charge", d3.forceManyBody())     //节点相互作用力，默认为斥力-30
                    .force("collision", d3.forceCollide(config.pointSize + 0.2).strength(0.1))   //碰撞
                    .force("center", d3.forceCenter(chart.getBodyWidth()/2, chart.getBodyHeight()/2));     //定义力模型坐标的中心点

force.nodes(nodes);   //绑定节点

force.force("link", d3.forceLink(links).strength(1).distance(20));   //绑定节点间链接

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

/* ----------------------------渲染节点------------------------  */
chart.renderNodes = function(){
    const points = chart.body().selectAll('circle')
                                .data(nodes);

          points.enter()
                  .append('circle')
                  .attr('r', config.pointSize)
                  .attr('fill', (d) => chart._colors(d.depth % 10))
                  .attr('stroke', config.pointStroke);

          points.exit()
                  .transition()
                  .attr('r', 1e-6)
                  .on('end', (d) =>{    //删除点，并重新绑定nodes
                        nodes.splice(nodes.indexOf(d),1);
                        force.nodes(nodes);
                    })
                  .remove();
}

/* ----------------------------渲染节点连线------------------------  */
chart.renderLinks = function(){
    const lines = chart.body().selectAll('line')
                                .data(links);

          lines.enter()
                 .insert('line', 'circle')
                 .attr('stroke', config.lineColor)
                 .attr('stroke-width', config.lineWidth);

          lines.exit()
                  .transition()
                  .on('end', (d) =>{    //删除线，并重新绑定links
                        links.splice(links.indexOf(d),1);
                        force.force("link", d3.forceLink(links).strength(1).distance(20));
                        force.restart();
                    })
                 .remove();
}

/* ----------------------------绑定鼠标交互事件------------------------  */
chart.addMouseOn = function(){
    const drag = d3.drag()
                     .on("start", (d) => {
                        d.fx = d.x;
                        d.fy = d.y;
                     })
                     .on("drag", (d) => {
                        d.fx = d3.event.x;
                        d.fy = d3.event.y;
                     })
                     .on("end", (d) => {
                        d.fx = null;
                        d.fy = null;
                     });

    chart.body().selectAll('circle')
                    .call(drag);
};

/* ----------------------------绑定tick事件------------------------  */
chart.addForceTick = function(){
    force.on("tick", function(){
        chart.body().selectAll('line')
                    .attr("x1", (d) => d.source.x)
                    .attr("y1", (d) => d.source.y)
                    .attr("x2", (d) => d.target.x)
                    .attr("y2", (d) => d.target.y);

        chart.body().selectAll('circle')
                    .attr("cx", (d) => d.x)
                    .attr("cy", (d) => d.y);
    })
};

chart.render = function(){

    chart.renderTitle();

    chart.renderNodes();

    chart.renderLinks();

    chart.addMouseOn();

    chart.addForceTick();
}

chart.renderChart();

});














