d3.csv('./data.csv', function(d){
    return [
        d.date,
        +d.money
    ];
}).then(function(data){

    /*
        定义图表大小及颜色
    */
    const w = 400,
          h = 300,
          color = 'rgb(194,53,49)',
          textColor = 'black';

    d3.select("#main")
        .append("svg")
        .attr("width", 600)
        .attr("height", 400);

    var g = d3.select("svg")
        .append("g")
        .attr('transform', 'translate(100,50)')
        .attr('fill', textColor);
    
    /*
        尺度转换函数
    */

    var yScale = d3.scaleLinear()
                    .domain([0, d3.max(data, (item) => item[1])])
                    .range([h, 0]);

    var xScale = d3.scaleBand()
                    .domain(data.map(item => item[0]))
                    .range([0, w])
                    .padding(0.1);

    /*
        坐标轴函数
    */

    var xAxis = d3.axisBottom(xScale);

    var yAxis = d3.axisLeft(yScale);

    /*
        添加柱子
    */

    g.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function(item){
            return xScale(item[0]);
        })
        .attr("width", xScale.bandwidth())
        .attr("height", function(item, i){
            return yScale(0) - yScale(item[1]);
        })
        .attr("y", function(item){
            return yScale(item[1]);
        })
        .attr('fill', color);
    
    /*
        添加坐标轴和文本标签
    */

    g.append("g")
        .attr('transform', 'translate(0,' + yScale(0) + ')')
        .call(xAxis)
        .append("text")
        .text("日期")
        .attr("stroke", textColor)
        .attr("class", "axisText")
        .attr("x", w)
        .attr("dy","2em")

    g.append("g")
        .call(yAxis)
        .append('text')
        .text('每日收入（元）')
        .attr('transform', 'rotate(-90)')
        .attr("dy","-3em")
        .attr("stroke", textColor)
        .attr("class", "axisText");

    g.append("text")
        .text("直方图")
        .attr("x", w/2)
        .attr("dy","-1em")
        .attr("class", "title")
        .attr("stroke", textColor)
        .attr("text-anchor", 'middle');
        
});













