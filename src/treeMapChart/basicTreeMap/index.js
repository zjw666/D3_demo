import Chart from "../../chart.js";

d3.json('./data.json').then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        title: '矩形树图',
        hoverColor: 'white',
        animateDuration: 1000
    }

    chart.margins(config.margins);
    
    /* ----------------------------数据转换------------------------  */
    const root = d3.hierarchy(data)
                    .sum((d) => d.house)
                    .sort((a,b) => a.value - b.value);

    const generateTreeMap = d3.treemap()
                    .size([chart.getBodyWidth(), chart.getBodyHeight()])
                    .round(true)
                    .padding(1);
    
    generateTreeMap(root);
    
    /* ----------------------------渲染矩形------------------------  */
    chart.renderRect = function(){
        const cells = chart.body().selectAll('.cell')
                                    .data(root.leaves());
                
              cells.enter()
                     .append('g')
                     .attr('class', (d, i) => 'cell cell-' + i)
                     .append('rect')
                   .merge(cells)
                     .attr('x', (d) => d.x0)
                     .attr('y', (d) => d.y0)
                     .attr('width', (d) => d.x1 - d.x0)
                     .attr('height', (d) => d.y1 - d.y0)
                     .attr('fill', (d,i) => chart._colors(i % 10));
            
              cells.exit()
                    .remove();     
    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){

        const texts = d3.selectAll('.cell')
                            .append('text');
              texts
                .attr('class', 'cell-text')
                .attr('transform', (d) => 'translate(' + (d.x0+d.x1)/2 + ',' + (d.y0+d.y1)/2 + ')' )
                .text((d) => d.data.name)
                .attr('stroke', config.textColor)
                .attr('fill', config.textColor)
                .attr('text-anchor', 'middle')
                .text( function(d){
                    if (textWidthIsOk(d, this)){
                        return d.data.name;
                    }else{
                        return '...';
                    }
                })
        
        // 检测文本长度是否合适
        function textWidthIsOk(d, text){
            const textWidth = text.getBBox().width;
            if ((d.x1-d.x0) >= textWidth) return true;
            return false;
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

        d3.selectAll('.cell rect')
            .on('mouseover', function(){
                const e = d3.event;
                e.target.style.cursor = 'hand'

                d3.select(e.target)
                    .attr('fill', config.hoverColor);
                
            })
            .on('mouseleave', function(d,i){
                const e = d3.event;
                
                d3.select(e.target)
                    .attr('fill', chart._colors(i % 10));
            });
    }
        
    chart.render = function(){

        chart.renderTitle();

        chart.renderRect();

        chart.renderText();

        chart.addMouseOn();
    }

    chart.renderChart();
    
        
});














