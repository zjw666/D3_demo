import Chart from '../../chart.js';

d3.json('./data.json').then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        padding: {top: 10, left: 0, bottom: 10, right: 0},
        textColor: 'black',
        title: '可放缩矩形树图',
        hoverColor: 'white',
        animateDuration: 1000
    }

    chart.margins(config.margins);
    chart.padding(config.padding);

    const width = chart.getBodyWidth();
    const height = chart.getBodyHeight();

    /* ----------------------------数据转换------------------------  */
    const root = d3.hierarchy(data)
                    .sum((d) => d.house)
                    .sort((a,b) => a.value - b.value);

    const generateTreeMap = d3.treemap()
                    .tile(function(node, x0, y0, x1, y1){
                        d3.treemapBinary(node, 0, 0, width, height);
                        for (const child of node.children) {
                            child.x0 = x0 + child.x0 / width * (x1 - x0);
                            child.x1 = x0 + child.x1 / width * (x1 - x0);
                            child.y0 = y0 + child.y0 / height * (y1 - y0);
                            child.y1 = y0 + child.y1 / height * (y1 - y0);
                        }
                    })

    generateTreeMap(root);

    const scaleX = d3.scaleLinear().rangeRound([0, width]);
    const scaleY = d3.scaleLinear().rangeRound([0, height]);

    const stack = [root.data.name];

    /* ----------------------------渲染矩形------------------------  */

    chart.renderRect = function(group, currentRoot){

        const cells = group.selectAll('.cell')
                            .data(currentRoot.children.concat(currentRoot))
                            .join('g');

        cells.filter(d => d === currentRoot ? d.parent : d.children)  //可以点击的节点包括两类：有孩子的非当前根节点、有父节点的当前根节点
                .attr('cursor', 'pointer')
                .on('click', d => d === currentRoot ? zoomOut(currentRoot) : zoomIn(d))

        cells.attr('class', (d, i) => 'cell cell-' + i)
            .append('rect')
            .attr('fill', (d,i) => d === currentRoot ? 'white' : chart._colors(i % 10));

        cells.append('text')
            .attr('class', 'cell-text')
            .text((d) => d.data.name)
            .attr("x", 10)
            .attr("y", 20)
            .attr('stroke', config.textColor)
            .attr('fill', config.textColor)
            .text((d) => d === currentRoot ? stack.join(' -> ') : d.data.name);

        position(group, currentRoot);

        function position(group, currentRoot){
            group.selectAll('.cell')
                    .attr('transform', d => d === currentRoot ? `translate(0, -30)` : `translate(${scaleX(d.x0)},${scaleY(d.y0)})`)
                 .select('rect')
                    .attr('width', d => d === currentRoot ? width : scaleX(d.x1) - scaleX(d.x0))
                    .attr('height', d => d === currentRoot ? 30 : scaleY(d.y1) - scaleY(d.y0));
        }

        function zoomIn(d){
            stack.push(d.data.name);
            const oldGroup = group.attr('pointer-events', 'none');
            const newGroup = group = chart.body().append('g').attr('transform', 'translate(0, 15)').call(chart.renderRect, d);   //绘制当前点击的节点的子节点盖在当前节点上，子节点均在当前节点围成的矩形区域内

            scaleX.domain([d.x0, d.x1]);
            scaleY.domain([d.y0, d.y1]);

            chart.body().transition()
                        .duration(config.animateDuration)
                        .call(
                            t => oldGroup.transition(t)
                                    .call(position, d.parent)   //将当前点击的节点放大充满整个绘图区
                                    .remove()                   //移除当前点击的节点
                        )
                        .call(
                            t => newGroup.transition(t)
                                    .attrTween('opacity', () => d3.interpolate(0, 1))    //子节点逐渐显现
                                    .call(position, d)         //将子节点放大充满整个绘图区
                        );

        }

        function zoomOut(d){
            stack.pop();
            const oldGroup = group.attr('pointer-events', 'none');
            const newGroup = group = chart.body().append('g').attr('transform', 'translate(0, 15)').call(chart.renderRect, d.parent);  //绘制当前点击的节点的兄弟节点，兄弟节点均在绘图区外

            scaleX.domain([d.parent.x0, d.parent.x1]);
            scaleY.domain([d.parent.y0, d.parent.y1]);

            chart.body().transition()
                        .duration(config.animateDuration)
                        .call(
                            t => oldGroup.transition(t)
                                    .call(position, d)   //将当前点击的节点的子节点缩小至原本点击节点的大小
                                    .remove()
                        )
                        .call(
                            t => newGroup.transition(t)
                                    .attrTween('opacity', () => d3.interpolate(0, 1))   //点击节点和兄弟节点逐渐显示
                                    .call(position, d.parent)   //将点击节点和兄弟节点缩小充满整个绘图区
                        );
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
        let group = chart.body().append('g').attr('transform', 'translate(0, 15)');

        chart.renderTitle();

        chart.renderRect(group, root);

    }

    chart.renderChart();


});














