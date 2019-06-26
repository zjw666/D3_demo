import Chart from "../../chart.js";

d3.csv('./data.csv', function(d){
    return {
        x: +d.x,
        y: +d.y,
        x1: +d.x1,
        y1: +d.y1,
        x2: +d.x2,
        y2: +d.y2,
        x3: +d.x3,
        y3: +d.y3,
    };
}).then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 80, bottom: 50, right: 80},
        textColor: 'black',
        gridColor: 'gray',
        ShowGridX: [10, 20, 30, 40, 50, 60, 70 ,80, 90, 100],
        ShowGridY: [10, 20, 30, 40, 50, 60, 70 ,80, 90, 100],
        title: '多符号散点图',
        pointSize: 100,
        hoverColor: 'white',
        animateDuration: 1000
    }

    chart.margins(config.margins);
    
    /* ----------------------------尺度转换------------------------  */
    chart.scaleX = d3.scaleLinear()
                    .domain([0, Math.ceil(d3.max(data, (d) => getMaxNum(d,'x'))/10)*10])
                    .range([0, chart.getBodyWidth()]);
    
    chart.scaleY = d3.scaleLinear()
                    .domain([0, Math.ceil(d3.max(data, (d) => getMaxNum(d,'y'))/10)*10])
                    .range([chart.getBodyHeight(), 0]);
    
    //获取数据行最大x值或y值
    function getMaxNum(d, type){
        const nums = [];
        Object.keys(d).forEach((key) => {
            if (key.indexOf(type) > -1) nums.push(d[key]);
        })
        return d3.max(nums);
    }
    
    /* ----------------------------渲染数据点------------------------  */
    chart.renderPoints = function(){
        /*
            改变数据结构，方便渲染
            [
                [[x,y],[x,y],...],
                [[x1,y1],[x1,y1],...],
                [[x2,y2],[x2,y2],...],
                [[x3,y3],[x3,y3],...],
            ]
        */
        const tempData = data.map((d) => {
            const items = [];
            d3.permute(d, Object.keys(d)).forEach((item,i,array) => {
                if (i % 2 === 0){
                    items.push([array[i],array[i+1],i/2]);
                }
            });
            return items;
        });

        const multiData = d3.zip.apply(this,tempData);

        let groups = chart.body().selectAll('.g')
                        .data(multiData);

        let points = groups.enter()
                              .append('g')
                           .merge(groups)
                              .attr('class', (d,i) => 'g points-' + i)
                              .attr('fill', (d,i) => chart._colors(i))
                              .selectAll('.point')
                              .data((d) => d);
            
            groups.exit()
                    .remove();

            points.enter()
                    .append('path')
                    .classed('point', true)
                  .merge(points)
                    .attr('transform', (d) => 'translate(' + chart.scaleX(d[0]) + ',' + chart.scaleY(d[1]) + ')')
                    .attr('d', d3.symbol().type(function (d) {
                        return d3.symbols[d[2]];
                    }).size(1))
                    .transition().duration(config.animateDuration)
                    .attr('d', d3.symbol().type(function (d) {
                        return d3.symbols[d[2]];
                    }).size(config.pointSize));
                    
            
            points.exit()
                    .remove();
            
    }

    /* ----------------------------渲染坐标轴------------------------  */
    chart.renderX = function(){
        chart.svg().insert('g','.body')
                .attr('transform', 'translate(' + chart.bodyX() + ',' + (chart.bodyY() + chart.getBodyHeight()) + ')')
                .attr('class', 'xAxis')
                .call(d3.axisBottom(chart.scaleX));
    }

    chart.renderY = function(){
        chart.svg().insert('g','.body')
                .attr('transform', 'translate(' + chart.bodyX() + ',' + chart.bodyY() + ')')
                .attr('class', 'yAxis')
                .call(d3.axisLeft(chart.scaleY));
    }

    chart.renderAxis = function(){
        chart.renderX();
        chart.renderY();
    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){
        d3.select('.xAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', chart.getBodyWidth())
                            .attr('y', 0)
                            .attr('fill', config.textColor)
                            .attr('dy', 30)
                            .text('X');

        d3.select('.yAxis').append('text')
                            .attr('class', 'axisText')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('fill', config.textColor)
                            .attr('dx', '-30')
                            .attr('dy', '10')
                            .text('Y');
    }

    /* ----------------------------渲染网格线------------------------  */
    chart.renderGrid = function(){
        d3.selectAll('.yAxis .tick')
            .each(function(d, i){
                if (config.ShowGridY.indexOf(d) > -1){
                    d3.select(this).append('line')
                        .attr('class','grid')
                        .attr('stroke', config.gridColor)
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', chart.getBodyWidth())
                        .attr('y2', 0);
                }
            });

        d3.selectAll('.xAxis .tick')
            .each(function(d, i){
                if (config.ShowGridX.indexOf(d) > -1){
                    d3.select(this).append('line')
                        .attr('class','grid')
                        .attr('stroke', config.gridColor)
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', 0)
                        .attr('y2', -chart.getBodyHeight());
                }
            });
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

        d3.selectAll('.point')
            .on('mouseover', function(d){
                const e = d3.event;
                const position = d3.mouse(chart.svg().node());
                e.target.style.cursor = 'hand'

                d3.select(e.target)
                    .attr('fill', config.hoverColor);
                
                chart.svg()
                    .append('text')
                    .classed('tip', true)
                    .attr('x', position[0]+5)
                    .attr('y', position[1])
                    .attr('fill', config.textColor)
                    .text('x: ' + d[0] + ', y: ' + d[1]);
            })
            .on('mouseleave', function(d){
                const e = d3.event;
                
                d3.select(e.target)
                    .attr('fill', chart._colors(d[2]));
                    
                d3.select('.tip').remove();
            })
            .on('mousemove', debounce(function(){
                    const position = d3.mouse(chart.svg().node());
                    d3.select('.tip')
                    .attr('x', position[0]+5)
                    .attr('y', position[1]-5);
                }, 6)
            );
    }
        
    chart.render = function(){

        chart.renderAxis();

        chart.renderText();

        chart.renderGrid();

        chart.renderPoints();

        chart.addMouseOn();

        chart.renderTitle();
    }

    chart.renderChart();
    
        
});














