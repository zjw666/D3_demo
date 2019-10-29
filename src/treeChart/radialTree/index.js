import Chart from "../../chart.js";

d3.json('./data.json').then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 50, bottom: 20, right: 50},
        textColor: 'black',
        title: '径向树图',
        hoverColor: 'gray',
        animateDuration: 1000,
        pointSize: 5,
        pointFill: 'white',
        pointStroke: 'red',
        lineStroke: 'gray'
    }

    chart.margins(config.margins);

    /* ----------------------------数据转换------------------------  */
    chart._nodeId = 0;  //用于标识数据唯一性

    const root = d3.hierarchy(data);

    const generateTree = d3.cluster()
                    .nodeSize([10, 10])
                    .separation((a,b) => a.parent === b.parent ? 1 : 3)
                    .size([2 * Math.PI, d3.min([chart.getBodyWidth(), chart.getBodyHeight()]) / 2 * 0.8]);

    generateTree(root);

    /* ----------------------------渲染节点------------------------  */
    chart.renderNode = function(){
        let nodes = d3.select('.groups');

        if (nodes.empty()){
            nodes =  chart.body()
                        .append('g')
                        .attr('class', 'groups')
                        .attr('transform', 'translate(' + chart.getBodyWidth()/2 + ',' + chart.getBodyHeight()/2 + ')');
        }

        const groups = nodes
                        .selectAll('.g')
                        .data(root.descendants(),  (d) => d.id || (d.id = ++chart._nodeId));

        chart.groupsEnter = groups.enter()
                                    .append('g')
                                    .attr('class', (d) => 'g ' + d.data.name)
                                    .attr('transform', (d) => {
                                        if (chart.first) return 'translate(' + chart.oldY * Math.cos(chart.oldX - Math.PI/2) + ',' + chart.oldY * Math.sin(chart.oldX - Math.PI/2) + ')';  //首次渲染，子树从（0，0）点开始放缩，否则，从点击位置开始放缩
                                    })

        chart.groupsEnter.append('circle')
                            .attr('r', config.pointSize)
                            .attr('cx', 0)
                            .attr('cy', 0)
                            .attr('stroke', config.pointStroke);

        chart.groupsEnter.merge(groups)
                            .transition().duration(config.animateDuration)
                            .attr('transform', (d) => {
                                return 'translate(' + d.y * Math.cos(d.x - Math.PI/2) + ',' + d.y * Math.sin(d.x - Math.PI/2) + ')';
                            })
                            .selectAll('circle')
                                .attr('fill', (d) => d._children ? config.hoverColor: config.pointFill);

        groups.exit()
                .attr('transform-origin', () => chart.targetNode.y * Math.cos(chart.targetNode.x - Math.PI/2) + ' ' + chart.targetNode.y * Math.sin(chart.targetNode.x - Math.PI/2))  //子树逐渐缩小到新位置
                .transition().duration(config.animateDuration)
                .attr('transform', 'scale(0.01)')
                .remove();
    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){
        d3.selectAll('.text').remove();

        const groups = d3.selectAll('.g');

        groups.append('text')
                .attr('x', 0)
                .attr('y', 0)
                .attr('class', 'text')
                .attr('text-anchor', 'middle')
                .attr('dy', 3)
                .text((d) => d.data.name)
                .attr('transform', function(d){
                    const offsetRadius = d.children? -(this.getBBox().width + config.pointSize) : this.getBBox().width + config.pointSize;
                    const translate = d.depth === 0 ? 'translate(' +  this.getBBox().width/2 + ',' + -this.getBBox().height/2 + ')' : 'translate(' + offsetRadius * Math.cos(d.x - Math.PI/2) + ',' + offsetRadius * Math.sin(d.x - Math.PI/2) + ')';
                    let angle = (180 * d.x / Math.PI) % 360;
                    if (angle > 90 && angle < 270) {
                        angle = angle + 180;
                    }
                    const rotate =  d.depth === 0 ? 'rotate(0)': 'rotate(' +  angle + ')';
                    return translate + ' ' + rotate;
                });
    }

    /* ----------------------------渲染连线------------------------  */
    chart.renderLines = function(){

        let link = d3.select('.links');

        if (link.empty()){
            link =  chart.body()
                        .insert('g', '.groups')
                        .attr('class', 'links')
                        .attr('transform', 'translate(' + chart.getBodyWidth()/2 + ',' + chart.getBodyHeight()/2 + ')')
        }

        const links = link
                        .selectAll('.link')
                        .data(root.links().map((item) => {
                            item.id = item.source.id + '-' + item.target.id;   // 为链接添加id
                            return item;
                        }), (d) => d.id );

            links.enter()
                    .append('path')
                    .attr('class', 'link')
                    .attr('fill', 'none')
                    .attr('stroke', config.lineStroke)
                    .attr('transform-origin', () => chart.oldY * Math.cos(chart.oldX - Math.PI/2) + ' ' + chart.oldY * Math.sin(chart.oldX - Math.PI/2))
                    .attr('transform', 'scale(0.01)')
                  .merge(links)
                    .transition().duration(config.animateDuration)
                    .attr('transform', 'scale(1)')
                    .attr('d', d3.linkRadial()
                                .angle((d) => d.x)
                                .radius((d) => d.y)
                     );

            links.exit()
                    .attr('transform-origin', () => chart.targetNode.y * Math.cos(chart.targetNode.x - Math.PI/2) + ' ' + chart.targetNode.y * Math.sin(chart.targetNode.x - Math.PI/2))  //子树逐渐缩小到新位置
                    .transition().duration(config.animateDuration)
                    .attr('transform', 'scale(0.01)')
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
        d3.selectAll('.g')
            .on('click', function(d){
                toggle(d);
                generateTree(root);
                chart.renderNode();
                chart.renderLines();
                chart.renderText();
                chart.addMouseOn();
            });

        function toggle(d){
            chart.first = true;
            if (d.children){
                d._children = d.children;
                d.children = null;
            }else{
                d.children = d._children;
                d._children = null;
            }
            chart.oldX = d.x;  //点击位置x坐标
            chart.oldY = d.y;  //点击位置y坐标
            chart.targetNode = d;  //被点击的节点，该节点的x和y坐标随后将被更新
        }
    }

    chart.render = function(){

        chart.renderTitle();

        chart.renderNode();

        chart.renderText();

        chart.renderLines();

        chart.addMouseOn();

    }

    chart.renderChart();


});














