import Chart from "../../chart.js";

d3.json('./data.json').then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        title: '基本封闭图',
        hoverColor: 'white',
        animateDuration: 1000
    }

    chart.margins(config.margins);
    
    /* ----------------------------数据转换------------------------  */
    const root = d3.hierarchy(data)
                    .sum((d) => d.house)
                    .sort((a,b) => a.value - b.value);

    const pack = d3.pack()
                    .size([chart.getBodyWidth(), chart.getBodyHeight()])
    
    pack(root);
    
    /* ----------------------------渲染圆圈------------------------  */
    chart.renderCircle = function(){
        const groups = chart.body().selectAll('.g')
                                    .data(root.descendants());
                
              groups.enter()
                      .append('g')
                      .attr('class', (d, i) => 'g g-' + i)
                      .append('circle')
                      .attr('class', 'circle')
                    .merge(groups.selectAll('.circle'))
                      .attr('cx', (d) => d.x)
                      .attr('cy', (d) => d.y)
                      .attr('r', (d) => d.r)
                      .attr('fill', (d) => chart._colors(d.depth % 10));
            
              groups.exit()
                      .selectAll('.circle')
                      .transition().duration(config.animateDuration)
                      .attr('r', 0)
                      .remove();     
    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){

        const texts = chart.body().selectAll('.text')
                                    .data(root.descendants());

              texts.enter()
                      .append('text')
                      .attr('class', 'text')
                   .merge(texts)
                      .attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')' )
                      .text((d) => d.data.name)
                      .attr('stroke', config.textColor)
                      .attr('fill', config.textColor)
                      .attr('text-anchor', 'middle')
                      .text( function(d){
                          if (d.children) return;
                          if (textWidthIsOk(d, this)){
                              return d.data.name;
                          }else{
                              return d.data.name.slice(0,3);
                          }
                        })
        
        // 检测文本长度是否合适
        function textWidthIsOk(d, text){
            const textWidth = text.getBBox().width;
            if (d.r*2 >= textWidth) return true;
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

        d3.selectAll('.g circle')
            .on('mouseover', function(){
                const e = d3.event;
                e.target.style.cursor = 'hand'

                d3.select(e.target)
                    .attr('fill', config.hoverColor);
                
            })
            .on('mouseleave', function(d){
                const e = d3.event;
                
                d3.select(e.target)
                    .attr('fill', chart._colors(d.depth % 10));
            });
    }
        
    chart.render = function(){

        chart.renderTitle();

        chart.renderCircle();

        chart.renderText();

        chart.addMouseOn();

    }

    chart.renderChart();
    
        
});














