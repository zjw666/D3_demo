//对于给定点集points和张力tension， 进行cardinal样条曲线插值， 返回基于x坐标的插值函数
function cardinalSpline(points, tension){

    const controlPoints = addControlPoints(points);

    const pointsNum = controlPoints.length;
    
    if ( pointsNum < 4) return;

    const m =  getCardinalMatrix(tension);

    return function(x){

        //当x等于控制点的x值时，直接返回对应的控制点坐标
        if (x <= controlPoints[0].x) return [controlPoints[0].x, controlPoints[0].y]; 

        if (x >= controlPoints[pointsNum-1].x) return  [controlPoints[pointsNum-1].x, controlPoints[pointsNum-1].y];

        //遍历控制点，找到x所在区间对应的4个控制点，计算返回相应的插值点
        for (let i=1; i < pointsNum-2; i++){
            if (controlPoints[i].x < x && controlPoints[i+1].x > x){
                return [
                    compute(m, controlPoints[i-1].x, controlPoints[i].x, controlPoints[i+1].x, controlPoints[i+2].x, (x-controlPoints[i].x)/(controlPoints[i+1].x-controlPoints[i].x)),
                    compute(m, controlPoints[i-1].y, controlPoints[i].y, controlPoints[i+1].y, controlPoints[i+2].y, (x-controlPoints[i].x)/(controlPoints[i+1].x-controlPoints[i].x)),
                ]
            }else if (controlPoints[i+1].x === x){
                return [x, controlPoints[i+1].y];
            }
        }
    }

}

//返回m矩阵
function getCardinalMatrix(t){
    return [
        -t, 2-t, t-2, t,
        2*t, t-3, 3-2*t, -t,
        -t, 0, t, 0,
        0, 1, 0, 0
    ]
}

//计算x分量或y分量
function compute(m, p0, p1, p2, p3, u){
    const a = m[0]*p0 + m[1]*p1 + m[2]*p2 + m[3]*p3;
    const b = m[4]*p0 + m[5]*p1 + m[6]*p2 + m[7]*p3;
    const c = m[8]*p0 + m[9]*p1 + m[10]*p2 + m[11]*p3;
    const d = m[12]*p0 + m[13]*p1 + m[14]*p2 + m[15]*p3;

    return a*Math.pow(u,3) + b*Math.pow(u,2) + c*u + d; //三次曲线函数
}

//左右各增加两个虚拟的控制点，保证控制点数量大于等于4
function addControlPoints(points){
    const newPoints = []

    points.forEach((point) => {
        newPoints.push(point);
    })

    newPoints.unshift(points[0]);
    newPoints.push(points[points.length-1]);

    return newPoints;
}

export default cardinalSpline;