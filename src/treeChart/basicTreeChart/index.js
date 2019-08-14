import Chart from "../../chart.js";

d3.json('./data.json').then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 50, bottom: 50, right: 50},
        textColor: 'black',
        title: '基础树图',
        hoverColor: 'gray',
        animateDuration: 1000,
        pointSize: 5,
        pointFill: 'white',
        pointStroke: 'red',
        paddingLeft: 20,
        lineStroke: 'gray'
    }

    chart.margins(config.margins);

    /* ----------------------------数据转换------------------------  */
    chart._nodeId = 0;  //用于标识数据唯一性

    const root = d3.hierarchy(data);

    const generateTree = d3.tree()
                    .size([chart.getBodyHeight(), chart.getBodyWidth()*0.8]);

    generateTree(root);

    /* ----------------------------渲染节点------------------------  */
    chart.renderNode = function(){

        const groups = chart.body().selectAll('.g')
                                    .data(root.descendants(), (d) => d.id || (d.id = ++chart._nodeId));

        const groupsEnter = groups.enter()
                                    .append('g')
                                    .attr('class', (d) => 'g g-' + d.id)
                                    .attr('transform-origin', (d) => {    //子树从点击位置逐渐放大
                                        if (d.parent){
                                            return chart.oldY + config.paddingLeft + ' ' + chart.oldX;
                                        }
                                        return d.y + config.paddingLeft + ' ' + d.x;
                                    })
                                    .attr('transform', (d) => {    //首次渲染进入不放缩
                                        if (d.parent && chart.first) return 'scale(0.01)' + 'translate(' + (chart.oldY + config.paddingLeft) + ',' + chart.oldX + ')';
                                        return 'scale(1)' + 'translate(' + (d.y + config.paddingLeft) + ',' + d.x + ')';
                                    })

              groupsEnter.append('circle')
                            .attr('r', config.pointSize)
                            .attr('cx', 0)
                            .attr('cy', 0)
                            .attr('fill', config.pointFill)
                            .attr('stroke', config.pointStroke);

              groupsEnter.merge(groups)
                            .transition().duration(config.animateDuration)
                            .attr('transform', (d) => 'translate(' + (d.y + config.paddingLeft) + ',' + d.x + ')')
                            .select('circle')
                                .attr('fill', (d) => d._children ? config.hoverColor : config.pointFill);

              groups.exit()
                        .attr('transform-origin', (d) => (chart.targetNode.y + config.paddingLeft) + ' ' + chart.targetNode.x)  //子树逐渐缩小到新位置
                        .transition().duration(config.animateDuration)
                        .attr('transform', 'scale(0.01)')
                        .remove();


    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){
        d3.selectAll('.text').remove();

        const groups = d3.selectAll('.g');

        groups.append('text')
              .attr('class', 'text')
              .text((d) => d.data.name.length<5?d.data.name:d.data.name.slice(0,3) + '...')
              .attr('dy', function(){
                  return chart.textDy || (chart.textDy = this.getBBox().height/4);
              })
              .attr('text-anchor', (d) =>{
                  return d.children ? 'end' : 'start';
              })
              .attr('dx', (d) =>{
                return d.children ? -config.pointSize*1.5 : config.pointSize*1.5;
            });
    }

    /* ----------------------------渲染连线------------------------  */
    chart.renderLines = function(){
        const nodesExceptRoot = root.descendants().slice(1);

        const links = chart.body().selectAll('.link')
                                .data(nodesExceptRoot, (d) => d.id || (d.id = ++chart._nodeId));

              links.enter()
                     .insert('path', '.g')
                     .attr('class', 'link')
                     .attr('transform-origin', (d) => {
                        if (d.parent){           //连线从点击位置逐渐放大
                            return chart.oldY + config.paddingLeft + ' ' + chart.oldX;
                        }
                        return d.y + config.paddingLeft + ' ' + d.x;
                    })
                    .attr('transform', (d) => {                //首次渲染进入不放缩
                        if (d.parent && chart.first) return 'scale(0.01)';
                        return 'scale(1)';
                    })
                   .merge(links)
                     .transition().duration(config.animateDuration)
                     .attr('d', (d) => {
                        return generatePath(d, d.parent);
                     })
                     .attr('transform', 'scale(1)')
                     .attr('fill', 'none')
                     .attr('stroke', config.lineStroke)

              links.exit()
                     .attr('transform-origin', (d) => {    //连线逐渐缩小到新位置
                         return chart.targetNode.y + config.paddingLeft + ' ' + chart.targetNode.x;
                     })
                     .transition().duration(config.animateDuration)
                     .attr('transform', 'scale(0.01)')
                     .remove();

        function generatePath(node1, node2){
            const path = d3.path();

            path.moveTo(node1.y + config.paddingLeft, node1.x);
            path.bezierCurveTo(
                                (node1.y + node2.y)/2 + config.paddingLeft, node1.x,
                                (node1.y + node2.y)/2 + config.paddingLeft, node2.x,
                                node2.y + config.paddingLeft, node2.x
                              );
            return path.toString();
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

        d3.selectAll('.g circle')
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
            chart.targetNode = d;  //被点击的节点
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














