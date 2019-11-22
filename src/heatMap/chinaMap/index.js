import Chart from "../../chart.js";

d3.json('./china.json').then(function(data){

    /* ----------------------------配置参数------------------------  */
    const chart = new Chart();
    const config = {
        margins: {top: 70, left: 80, bottom: 30, right: 80},
        textColor: 'black',
        title: '中国人口热力图'
    }

    chart.margins(config.margins);

    /* ----------------------------尺度转换------------------------  */
    const projection = d3.geoMercator()
                            .center([104, 38])
                            .scale(355)
                            .translate([chart.getBodyWidth()/2, chart.getBodyHeight()/2])

    /* ----------------------------准备数据------------------------  */
    data.features.pop();
    data.features.forEach((item) => {
        item.properties.density = Math.random() * 100;
    })

    /* ----------------------------渲染地图轮廓------------------------  */
    chart.renderMap = function(){
        const path = d3.geoPath()
                        .projection(projection);

        let map = chart.body().selectAll('path')
                                .data(data.features);

            map.enter()
                 .append('path')
                 .attr('class', (d) => 'provinces ' + d.properties.name)
               .merge(map)
                 .attr('d', path)
                 .attr('stroke', 'white')
                 .attr('stroke-width', 1)
                 .attr('fill', 'gray');

            map.exit()
                .remove();
    }

    /* ----------------------------渲染省市中心点------------------------  */
    chart.renderCenter = function(){
        const heatMap = h337.create({
            container: chart.box().node(),
            maxOpacity: 0.9,
            minOpacity: 0.1,
            blur: 0.9,
            radius: 15,
            gradient: {
              '.1': 'gray',
              '.3': 'blue',
              '.5': 'green',
              '.7': 'yellow',
              '.9': 'red'
            }
        });

        const points = data.features.map((d) => ({
            x: Math.round(projection(d.properties.center)[0] + config.margins.left),
            y: Math.round(projection(d.properties.center)[1] + config.margins.top),
            value: d.properties.density
        }));

        heatMap.setData({
            max: 100,
            min: 0,
            data: points
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

        d3.selectAll('.provinces')
            .on('mouseover', function(d){
                const e = d3.event;
                const position = d3.mouse(chart.svg().node());

                d3.select(e.target)
                    .attr('stroke-width', 2);

                chart.svg()
                    .append('text')
                    .classed('tip', true)
                    .attr('x', position[0]+5)
                    .attr('y', position[1])
                    .attr('fill', config.textColor)
                    .text(d.properties.name);
            })
            .on('mouseleave', function(d,i){
                const e = d3.event;

                d3.select(e.target)
                    .attr('stroke-width', 1);

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

        chart.renderTitle();

        chart.renderMap();

        chart.renderCenter();

        chart.addMouseOn();
    }

    chart.renderChart();

});














