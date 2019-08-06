import Chart from "../../chart.js";

d3.json('./data.json').then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 80, left: 50, bottom: 50, right: 50},
        textColor: 'black',
        title: '基础旭日图',
        hoverColor: 'gray',
        animateDuration: 1000,
    }

    chart.margins(config.margins);

    /* ----------------------------数据转换------------------------  */
    chart._nodeId = 0;  //用于标识数据唯一性

    data = addId(data);

    function addId(d){     //给数据标识唯一性Id
        d.id = ++ chart._nodeId;
        if (d.children){
            d.children.forEach((item) => addId(item))
        }
        return d;
    }

    const root = d3.hierarchy(data)
                    .sum((d) => d.house)
                    .sort((a,b) => a.value - b.value);

    chart.currentRoot = root.data.id;     //记录当前旭日图中心根节点id

    const partition = d3.partition()
                    .size([chart.getBodyWidth(), chart.getBodyHeight()])
                    .round(true);

    partition(root);

    let nodes = root.descendants();

    /* ----------------------------尺度转换------------------------  */

    chart.scaleXToAngle = d3.scaleLinear()
                              .domain([0, chart.getBodyWidth()])
                              .range([0, Math.PI * 2]);

    chart.scaleYToRadius = d3.scaleLinear()
                              .domain([0, chart.getBodyHeight()])
                              .range([0, d3.min([chart.getBodyWidth(), chart.getBodyHeight()]) / 2]);

    /* ----------------------------渲染扇形------------------------  */
    chart.renderSlice = function(){
        const slices = chart.body().selectAll('.slice')
                                .data(nodes, (d) => d.data.id);

        chart.slicesEnter = slices.enter()
                                    .append('g')
                                    .attr('transform', 'translate(' + chart.getBodyWidth()/2 + ',' + chart.getBodyHeight()/2 + ')')
                                    .attr('class', 'slice');

        chart.slicesEnter.append('path')
                            .attr('stroke', 'white')
                            .attr('fill', (d) => chart._colors(d.data.id % 10));

        chart.slicesEnter.merge(slices)
                            .select('path')
                                .transition().duration(config.animateDuration)
                                .attrTween('d', arcTween);

        slices.exit()
                .remove();

        function arcTween(d){                //圆弧的角度和半径过渡动画
            let currentRadius = this._currentR;

            if (!currentRadius){
                currentRadius = chart.scaleYToRadius(d.y1)
            }

            const interpolateR = d3.interpolate(    //只对外半径插值
                currentRadius,
                chart.scaleYToRadius(d.y1),
            )

            let currentArc = this._current;

            if (!currentArc){
                currentArc = {startAngle: 0, endAngle: 0};
            }

            const interpolateArc = d3.interpolate(     //对弧度插值
                currentArc,
                {
                    startAngle: chart.scaleXToAngle(d.x0),
                    endAngle: chart.scaleXToAngle(d.x1)
                }
            )

            this._current = interpolateArc(1);
            this._currentR = interpolateR(1);

            return function(t){
                let arc = d3.arc()
                        .outerRadius(interpolateR(t))
                        .innerRadius(chart.scaleYToRadius(d.y0));

                return arc(interpolateArc(t))
            };
        }
    }

    /* ----------------------------渲染文本标签------------------------  */
    chart.renderText = function(){
        const slices = chart.body().selectAll('.slice');

        chart.slicesEnter.append('text')
                            .attr('class', 'text')
                            .attr('stroke', config.textColor)
                            .attr('dy', 5)
                            .attr('text-anchor', 'middle');


        chart.slicesEnter.merge(slices)
                            .select('text')
                                .attr('x', (d) => getTextLocation(d, 'x'))
                                .attr('y', (d) => getTextLocation(d, 'y'))
                                .attr('transform', (d) => {
                                    let rotateAngle = (chart.scaleXToAngle(d.x0) + chart.scaleXToAngle(d.x1)) / 2 * 180 / Math.PI;
                                    if (chart.scaleYToRadius(d.y0) === 0) rotateAngle = 0;
                                    return 'rotate(' + rotateAngle + ' '+ getTextLocation(d, 'x') + ','+ getTextLocation(d, 'y') +')';
                                })
                                .text('')
                                .transition().delay(config.animateDuration)
                                .text((d) => d.data.id);


        function getTextLocation(d, type){     //获取文本的x和y坐标
            let middleRadius = 0;
            let middleAngle = 0;

            if (chart.scaleYToRadius(d.y0) > 0){
                middleAngle = (chart.scaleXToAngle(d.x0) + chart.scaleXToAngle(d.x1))/2;
                middleRadius = (chart.scaleYToRadius(d.y1) + chart.scaleYToRadius(d.y0))/2;
            }

            if (type === 'x'){
                return Math.sin(middleAngle) * middleRadius;
            }else if (type === 'y'){
                return -Math.cos(middleAngle) * middleRadius;
            }
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
        d3.selectAll('.slice')
            .on('click', function(d){
                if (d.data.id === chart.currentRoot){    //点击中心节点回退
                    if (d.parent){
                        const newD = d.parent.copy();
                        newD.parent = d.parent.parent;
                        partition(newD);
                        nodes = newD.descendants();
                        chart.currentRoot = d.parent.data.id;
                        chart.renderSlice();
                        chart.renderText();
                        chart.addMouseOn();
                    }
                }else{                        //点击其余节点下钻
                    const newD = d.copy();
                    newD.parent = d.parent;
                    partition(newD);
                    nodes = newD.descendants();
                    chart.currentRoot = d.data.id;
                    chart.renderSlice();
                    chart.renderText();
                    chart.addMouseOn();
                }
            });
    }

    chart.render = function(){

        chart.renderTitle();

        chart.renderSlice();

        chart.renderText();

        chart.addMouseOn();

    }

    chart.renderChart();


});














