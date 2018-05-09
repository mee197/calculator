var _hmt = _hmt || [];
(function() {
    var hm = document.createElement("script");
    hm.src = "//hm.baidu.com/hm.js?964edf0ab45fadfe07657bb15cdae942";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();

// 说明：不等式只支持b代表的括号

/**
 * 根据id获取元素
 *
 * @param {Object} id
 */
function e(id) {
    return document.getElementById(id);
}

/**
 * 选中加法时
 */
function setCarryingState() {
    if(e("addition").checked) {
        e("carrying").disabled = false;
    } else {
        e("carrying").disabled = true;
        e("carrying").checked = false;
    }
}

/**
 * 选中减法时
 */
function setDecompositionState() {
    if(e("subtraction").checked) {
        e("decomposition").disabled = false;
    } else {
        e("decomposition").disabled = true;
        e("decomposition").checked = false;
    }
}

/**
 * 选题型时设置输入框是否可输入，以及输入框中的值
 *
 * @param {Object} chk  input框
 * @param {Object} eid  input框的id值
 * @param {Object} v  input框的内容值
 */
function setQty(chk, eid, v) {
    if(chk.checked) {
        e(eid).disabled = false;
        e(eid).value = v;
    } else {
        e(eid).disabled = true;
        e(eid).value = 0;
    }
}

var CONFIG;
var NON_PRIMES;
var ra = []; //定义存算式的数组

/**
 * 出题函数
 */
function generate() {

    //选中加法
    var add = e("addition").checked;

    //选中减法
    var sub = e("subtraction").checked;

    //选中乘法
    var mul = e("multiplication").checked;

    //选中除法
    var div = e("division").checked;

    //如果没有选中任意一种计算类型，则弹窗提示，并退出
    if(!add && !sub && !mul && !div) {
        alert("请至少选择一种计算类型");
        return;
    }

    //获取三种题型的题目数量
    var q2 = parseInt(e("qty_2").value);
    var q3 = parseInt(e("qty_3").value);
    var q4 = parseInt(e("qty_4").value);
    var qty = q2 + q3 + q4;
    if(qty <= 0) {
        alert("请选择题型");
        return;
    }

    //数值范围
    var range = parseInt(e("range").value);

    //各种题目类型的百分比
    var qb = parseFloat(e("diff_blank").value) / 10;
    var qi = parseFloat(e("diff_iq").value) / 10;
    var qs = parseFloat(e("diff_sign").value) / 10;

    //进位
    var car = e("carrying").checked;

    //退位
    var dec = e("decomposition").checked;

    //当百分比超出总和1
    if((qb + qi + qs) > 1) {
        alert("中间填空、不等式与符号填空的总百分比不能超过100%");
        return;
    }

    //将所有的值统一装进一个对象中
    CONFIG = {
        range: range,
        add: add,
        sub: sub,
        mul: mul,
        div: div,
        q2: q2,
        q3: q3,
        q4: q4,
        qb: qb,
        qi: qi,
        qs: qs,
        car: car,
        dec: dec
    };

    // 如果有乘除法，我们预先取出数值范围内的非素数，方便后续的高效选择
    if(CONFIG.mul || CONFIG.div) {
        NON_PRIMES = [];
        for(var i = 4; i <= CONFIG.range; i++) {
            for(var j = 2; j < i; j++) {
                if((i % j) == 0) {
                    NON_PRIMES.push(i);
                    break;
                }
            }
        }
    }

    //给ra数组创建10个空二维数组
    for(var i = 0; i < 10; i++) {
        ra[i] = [];
    }

    //出两个数计算的题目
    generate2(ra);
    //出三个数计算的题目
    generate3(ra);
    //出四个数的平衡式
    generate4(ra);

    //开始创建表格
    var html = "<table class='table table-striped'>";

    var i = 0;
    //创建表格
    for(var ii = 0; ii < ra.length; ii++) {
        var arr = ra[ii];
//		console.log(arr);
        for(var jj = 0; jj < arr.length; jj++) {
            if((i % 4) == 0) {
                html += "<tr>";
            }

            var exp = arr[jj];
            var ht = exp.replace(/\(\s*\)/g, "(&nbsp;&nbsp;)").replace("<", "&lt;").replace(">", "&gt;");
            html += "<td>" + ht + "=</td>";

            if((i % 4) == 3) {
                html += "</tr>";
            }

            i++;
        }
    }

    //完善表格尾部
    var j = 3 - (i % 4);
    if(j > 0) {
        while(j-- > 0) {
            html += "<td></td>";
        }

        html += "</tr>";
    }

    html += "</table>";

    //将创建的表格打印到试题内容显示区域
    $("#num-totle").text(i);
    $(".info-content").html(html);
}

/**
 * 产生随加数
 *
 * @param {Object} d
 */
function rand(d) {
    return Math.ceil(Math.random() * d);
}

function binarySearch(a, v) {
    var low = 0;
    var high = a.length - 1;
    while(low <= high) {
        var mid = (low + high) >>> 1;
        var midVal = a[mid];
        if(midVal < v) {
            low = mid + 1;
        } else if(midVal > v) {
            high = mid - 1;
        } else {
            return mid;
        }
    }

    return -(low + 1);
}

/**
 * 出两个数计算的题目
 *
 * @param {Object} ra  存储题目的数组
 */
function generate2(ra) {
    var sa = [];
    //判断加减乘除是否被选择
    if(CONFIG.add) {
        sa.push("Add");
    }
    if(CONFIG.sub) {
        sa.push("Sub");
    }
    if(CONFIG.mul) {
        sa.push("Mul");
    }
    if(CONFIG.div) {
        sa.push("Div");
    }
//	console.log(sa);

    //两位数加减乘数格式定义
    var tms = {
        "Add": {
            "normal": "a+b",
            "blank": ["()+b=c", "a+()=c", "c=()+b", "c=a+()"],
            "sign": ["a○b=c"],
            "inequal": ["a+()?c"]
        },
        "Sub": {
            "normal": "c-b",
            "blank": ["()-b=a", "c-()=a", "a=()-b", "a=c-()"],
            "sign": ["c○b=a"],
            "inequal": ["c-()?a"]
        },
        "Mul": {
            "normal": "a×b",
            "blank": ["()×b=c", "a×()=c", "c=()×b", "c=a×()"],
            "sign": ["a○b=c"],
            "inequal": ["a×()?c"]
        },
        "Div": {
            "normal": "c÷b",
            "blank": ["()÷b=a", "c÷()=a", "a=()÷b", "a=c÷()"],
            "sign": ["c○b=a"],
            "inequal": ["c÷()?a"]
        }
    };

    //获取两个数计算的题目数量
    var qty = CONFIG.q2;

    /**
     * sa.length表示选择了几种计算类型，例如：选择了加法和减法两种计算类型，则sa.length=2
     *
     * p表示已经选择的计算类型中，平均每种题目多少道
     */
    var q = Math.floor(qty / sa.length);

    //只要小于计算类型的数量，就继续出题
    for(var i = 0; i < sa.length; i++) {

        //每次出平均出题量那么多道题
        callGenerate2(ra, sa[i], q, tms[sa[i]]);

        //将每次已经出题的题量减去
        qty -= q;
//		console.log(qty);
    }

    //如果最后题目还没有出完，就将最后没出完的题目以随机一种题型出出来
    if(qty > 0) {
        //随机题型
        var i = rand(sa.length) - 1;
        //出题
        callGenerate2(ra, sa[i], qty, tms[sa[i]]);

    }
}

/**
 * 根据所有给出的信息出题
 *
 * @param {Object} ra  存储题目的数组
 * @param {Object} cal  计算类型
 * @param {Object} qty  出题量
 * @param {Object} tm  出题的格式
 */
function callGenerate2(ra, cal, qty, tm) {

    var extra;
    if("Add" == cal) {
        extra = ", CONFIG.car";
    } else if("Sub" == cal) {
        extra = ", CONFIG.dec";
    } else {
        extra = "";
    }

    var qbQty = Math.floor(qty * CONFIG.qb);
    var qiQty = Math.floor(qty * CONFIG.qi);
    var qsQty = Math.floor(qty * CONFIG.qs);
    var nmQty = qty - qbQty - qiQty - qsQty;

    if(nmQty > 0) {
        eval("generate2" + cal + "Normal(ra, CONFIG.range, nmQty" + extra + ", tm['normal'])");
    }

    if(qbQty > 0) {
        eval("generate2" + cal + "Diff(ra, CONFIG.range, qbQty" + extra + ", tm['blank'])");
    }

    if(qiQty > 0) {
        eval("generate2" + cal + "Diff(ra, CONFIG.range, qiQty" + extra + ", tm['inequal'])");
    }

    if(qsQty > 0) {
        eval("generate2" + cal + "Diff(ra, CONFIG.range, qsQty" + extra + ", tm['sign'])");
    }
}

function getAddends(range, car) {
    var arr = [];

    // 圈定一个和的范围
    var start, end;
    if(range <= 10) {
        start = 2;
        end = range;

        // 随机加几个加数为0的算式
        for(var i = 1, n = rand(3); i < n; i++) {
            if(rand(2) == 1) {
                arr.push({
                    a: 0,
                    b: rand(10)
                });
            } else {
                arr.push({
                    a: rand(10),
                    b: 0
                });
            }
        }
    } else {
        start = Math.floor(range * 0.5) + 1;
        end = range;
    }

    for(var i = start; i <= end; i++) {
        for(var j = 1; j < i; j++) {
            var a = j;
            var b = i - j;
            if(range > 10 && car && ((a % 10) + (b % 10)) <= 10) {
                continue;
            }

            arr.push({
                a: a,
                b: b
            });
        }
    }

    return arr;
}

function addResult(ra, tpl, r, range, formatFunc, collected, ignored) {
    var s = formatFunc(tpl, r, range);
    var k = tpl + "@" + r.a + "," + r.b + "," + r.c;
    if(s) {
        if(!collected[k]) {
            ra[rand(ra.length) - 1].push(s);
            collected[k] = 1;
            collected.count++;
            return true;
        }
    } else if(!ignored[k]) {
        ignored[k] = 1;
        ignored.count++;
    }

    return false;
}

function generate2AddNormal(ra, range, qty, car, tpl) {
    var addends = getAddends(range, car);

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < addends.length) {
        var cadidates = addends.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            if(addResult(ra, tpl, r, range, format2Add, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function generate2AddDiff(ra, range, qty, car, templates) {
    var addends = getAddends(range, car);
    var total = addends.length * templates.length;
    if(total < 1000) {
        var tmp = [];
        for(var i = 0; i < addends.length; i++) {
            var c = addends[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: c.a,
                    b: c.b,
                    t: templates[j]
                });
            }
        }

        addends = tmp;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < addends.length) {
        var cadidates = addends.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            var tpl = r.t ? r.t : templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format2Add, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function format2Add(tpl, r, range) {
    var s = tpl;
    if(tpl.indexOf("?") > 0) {
        var start = range <= 10 ? 1 : 2;
        var sg = getSign(1, false, r.b < (range - r.a - start));
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.a + r.b);
}

function generate2SubNormal(ra, range, qty, dec, tpl) {
    var addends = getAddends(range, dec);

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < addends.length) {
        var cadidates = addends.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            if(addResult(ra, tpl, r, range, format2Sub, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function generate2SubDiff(ra, range, qty, dec, templates) {
    var addends = getAddends(range, dec);
    var total = addends.length * templates.length;
    if(total < 1000) {
        var tmp = [];
        for(var i = 0; i < addends.length; i++) {
            var c = addends[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: c.a,
                    b: c.b,
                    t: templates[j]
                });
            }
        }

        addends = tmp;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < addends.length) {
        var cadidates = addends.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            var tpl = r.t ? r.t : templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format2Sub, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function format2Sub(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    if(tpl.indexOf("?") > 0) {
        var start = range <= 10 ? 1 : 2;
        var sg = getSign(1, r.b < ((r.a + r.b) - start), false);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.a + r.b);
}

function getFactors(range) {
    var topIndex = binarySearch(NON_PRIMES, range);
    if(topIndex < 0) {
        topIndex = -topIndex - 2;
    }

    var arr = [];
    if(topIndex >= 0) {
        for(var i = topIndex; i >= 0; i--) {
            var r = NON_PRIMES[i];
            var j = range <= 10 ? rand(2) : 2;
            for(; j < r; j++) {
                if((r % j) == 0) {
                    arr.push({
                        a: j,
                        b: r / j
                    });
                }
            }
        }
    }

    return arr;
}

function generate2MulNormal(ra, range, qty, tpl) {
    var factors = getFactors(range);

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < factors.length) {
        var cadidates = factors.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            if(addResult(ra, tpl, r, range, format2Mul, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function generate2MulDiff(ra, range, qty, templates) {
    var factors = getFactors(range);
    var total = factors.length * templates.length;
    if(total < 1000) {
        var tmp = [];
        for(var i = 0; i < factors.length; i++) {
            var c = factors[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: c.a,
                    b: c.b,
                    t: templates[j]
                });
            }
        }

        factors = tmp;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < factors.length) {
        var cadidates = factors.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            var tpl = r.t ? r.t : templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format2Mul, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function format2Mul(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    if(tpl.indexOf("?") > 0) {
        var start = range <= 10 ? 1 : 2;
        var sg = getSign(1, false, r.a * (r.b + 1) <= range);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.a * r.b);
}

function generate2DivNormal(ra, range, qty, tpl) {
    var factors = getFactors(range);

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < factors.length) {
        var cadidates = factors.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            if(addResult(ra, tpl, r, range, format2Div, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function generate2DivDiff(ra, range, qty, templates) {
    var factors = getFactors(range);
    var total = factors.length * templates.length;
    if(total < 1000) {
        var tmp = [];
        for(var i = 0; i < factors.length; i++) {
            var c = factors[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: c.a,
                    b: c.b,
                    t: templates[j]
                });
            }
        }

        factors = tmp;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < factors.length) {
        var cadidates = factors.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            var tpl = r.t ? r.t : templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format2Div, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function format2Div(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    if(tpl.indexOf("?") > 0) {
        var start = range <= 10 ? 1 : 2;
        var factors = getOwnFactors(r.a * r.b);
        var sg = getSign(1, r.b != factors[factors.length - 1], false);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.a * r.b);
}

function generate3(ra) {
    var sa = [];
    if(CONFIG.add) {
        sa.push("Add");
    }
    if(CONFIG.sub) {
        sa.push("Sub");
    }
    if(CONFIG.mul) {
        sa.push("Mul");
    }
    if(CONFIG.div) {
        sa.push("Div");
    }

    var tms = {
        "AddAdd": {
            "normal": "a+b+c",
            "blank": ["()+b+c=d", "a+()+c=d", "a+b+()=d", "d=()+b+c", "d=a+()+c", "d=a+b+()"],
            "sign": ["a○b+c=d", "a+b○c=d", "a○b○c=d"],
            "inequal": ["a+()+c?d"]
        },
        "AddSub": {
            "normal": "a+b-c",
            "blank": ["()+b-c=d", "a+()-c=d", "a+b-()=d", "d=()+b-c", "d=a+()-c", "d=a+b-()"],
            "sign": ["a○b-c=d", "a+b○c=d", "a○b○c=d"],
            "inequal": ["a+()-c?d"]
        },
        "AddMul": {
            "normal": "a+b×c",
            "blank": ["()+b×c=d", "a+()×c=d", "a+b×()=d", "d=()+b×c", "d=a+()×c", "d=a+b×()"],
            "sign": ["a○b×c=d", "a+b○c=d", "a○b○c=d"],
            "inequal": ["a+()×c?d"]
        },
        "AddDiv": {
            "normal": "a+b÷c",
            "blank": ["()+b÷c=d", "a+()÷c=d", "a+b÷()=d", "d=()+b÷c", "d=a+()÷c", "d=a+b÷()"],
            "sign": ["a○b÷c=d", "a+b○c=d", "a○b○c=d"],
            "inequal": ["a+()÷c?d"]
        },
        "SubAdd": {
            "normal": "a-b+c",
            "blank": ["()-b+c=d", "a-()+c=d", "a-b+()=d", "d=()-b+c", "d=a-()+c", "d=a-b+()"],
            "sign": ["a○b+c=d", "a-b○c=d", "a○b○c=d"],
            "inequal": ["a-()+c?d"]
        },
        "SubSub": {
            "forward": "AddAdd",
            "normal": "d-b-c",
            "blank": ["()-b-c=a", "d-()-c=a", "d-b-()=a", "a=()-b-c", "a=d-()-c", "a=d-b-()"],
            "sign": ["d○b-c=a", "d-b○c=a", "d○b○c=a"],
            "inequal": ["d-()-c!a"]
        },
        "SubMul": {
            "forward": "AddMul",
            "normal": "d-b×c",
            "blank": ["()-b×c=a", "d-()×c=a", "d-b×()=a", "a=()-b×c", "a=d-()×c", "a=d-b×()"],
            "sign": ["d○b×c=a", "d-b○c=a", "d○b○c=a"],
            "inequal": ["d-()×c!a"]
        },
        "SubDiv": {
            "forward": "AddDiv",
            "normal": "d-b÷c",
            "blank": ["()-b÷c=a", "d-()÷c=a", "d-b÷()=a", "a=()-b÷c", "a=d-()÷c", "a=d-b÷()"],
            "sign": ["d○b÷c=a", "d-b○c=a", "d○b○c=a"],
            "inequal": ["d-()÷c!a"]
        },
        "MulAdd": {
            "forward": "AddMul",
            "normal": "c×b+a",
            "blank": ["()×b+a=d", "c×()+a=d", "c×b+()=d", "d=()×b+a", "d=c×()+a", "d=c×b+()"],
            "sign": ["c○b+a=d", "c×b○a=d", "c○b○a=d"],
            "inequal": ["c×()+a?d"]
        },
        "MulSub": {
            "normal": "a×b-c",
            "blank": ["()×b-c=d", "a×()-c=d", "a×b-()=d", "d=()×b-c", "d=a×()-c", "d=a×b-()"],
            "sign": ["a○b-c=d", "a×b○c=d", "a○b○c=d"],
            "inequal": ["a×()-c?d"]
        },
        "MulMul": {
            "normal": "a×b×c",
            "blank": ["()×b×c=d", "a×()×c=d", "a×b×()=d", "d=()×b×c", "d=a×()×c", "d=a×b×()"],
            "sign": ["a○b×c=d", "a×b○c=d", "a○b○c=d"],
            "inequal": ["a×()×c?d"]
        },
        "MulDiv": {
            "normal": "a×b÷c",
            "blank": ["()×b÷c=d", "a×()÷c=d", "a×b÷()=d", "d=()×b÷c", "d=a×()÷c", "d=a×b÷()"],
            "sign": ["a○b÷c=d", "a×b○c=d", "a○b○c=d"],
            "inequal": ["a×()÷c?d"]
        },
        "DivAdd": {
            "forward": "AddDiv",
            "normal": "b÷c+a",
            "blank": ["()÷c+a=d", "b÷()+a=d", "b÷c+()=d", "d=()÷c+a", "d=b÷()+a", "d=b÷c+()"],
            "sign": ["b○c+a=d", "b÷c○a=d", "b○c○a=d"],
            "inequal": ["()÷c+a?d"]
        },
        "DivSub": {
            "normal": "a÷b-c",
            "blank": ["()÷b-c=d", "a÷()-c=d", "a÷b-()=d", "d=()÷b-c", "d=a÷()-c", "d=a÷b-()"],
            "sign": ["a○b-c=d", "a÷b○c=d", "a○b○c=d"],
            "inequal": ["a÷()-c?d"]
        },
        "DivMul": {
            "normal": "a÷b×c",
            "blank": ["()÷b×c=d", "a÷()×c=d", "a÷b×()=d", "d=()÷b×c", "d=a÷()×c", "d=a÷b×()"],
            "sign": ["a○b×c=d", "a÷b○c=d", "a○b○c=d"],
            "inequal": ["a÷()×c?d"]
        },
        "DivDiv": {
            "forward": "MulMul",
            "normal": "d÷b÷c",
            "blank": ["()÷b÷c=a", "d÷()÷c=a", "d÷b÷()=a", "a=()÷b÷c", "a=d÷()÷c", "a=d÷b÷()"],
            "sign": ["d○b÷c=a", "d÷b○c=a", "d○b○c=a"],
            "inequal": ["d÷()÷c!a"]
        }
    };

    var qty = CONFIG.q3;
    var q = Math.floor(qty / (sa.length * sa.length));
    for(var i = 0; i < sa.length; i++) {
        for(var j = 0; j < sa.length; j++) {
            callGenerate3(ra, sa[i] + sa[j], q, tms[sa[i] + sa[j]]);
            qty -= q;
        }
    }

    if(qty > 0) {
        var i = rand(sa.length) - 1;
        var j = rand(sa.length) - 1;
        callGenerate3(ra, sa[i] + sa[j], qty, tms[sa[i] + sa[j]]);
    }
}

function callGenerate3(ra, cal, qty, tm) {
    if(tm["forward"]) {
        cal = tm["forward"];
    }

    var qbQty = Math.floor(qty * CONFIG.qb);
    var qiQty = Math.floor(qty * CONFIG.qi);
    var qsQty = Math.floor(qty * CONFIG.qs);
    var nmQty = qty - qbQty - qiQty - qsQty;

    if(nmQty > 0) {
        eval("generate3" + cal + "Normal(ra, CONFIG.range, nmQty, tm['normal'])");
    }

    if(qbQty > 0) {
        eval("generate3" + cal + "Diff(ra, CONFIG.range, qbQty, tm['blank'])");
    }

    if(qiQty > 0) {
        eval("generate3" + cal + "Diff(ra, CONFIG.range, qiQty, tm['inequal'])");
    }

    if(qsQty > 0) {
        eval("generate3" + cal + "Diff(ra, CONFIG.range, qsQty, tm['sign'])");
    }
}

function getAddAddTriples(range) {
    var arr = [];
    var start = range <= 10 ? 1 : Math.ceil(range * 0.15);
    var end = range <= 10 ? (range - 2) : (range - 4);
    for(var i = start; i <= end; i++) {
        for(var j = start; j <= end; j++) {
            var s = i + j;
            if(range < (s + start)) {
                break;
            }

            for(var k = start; k <= end; k++) {
                if(range < (s + k)) {
                    break;
                }

                arr.push({
                    a: i,
                    b: j,
                    c: k
                });
            }
        }
    }

    return arr;
}

function getRandomAddAddTriple(range) {
    var d = Math.ceil(range * 0.5) + rand(Math.floor(range * 0.5));

    var a, b;
    if(d <= 10) {
        a = rand(d - 2);
        b = rand(d - a - 1);
    } else {
        var start = Math.ceil(d * 0.15);
        a = (start - 1) + rand(Math.floor(d * 0.425) - (start - 1));
        b = (start - 1) + rand(d - a - 2 - (start - 1));
    }

    return {
        a: a,
        b: b,
        c: d - a - b
    };
}

function generate3AddAddNormal(ra, range, qty, tpl) {
    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };
    if(range <= 20) {
        var triples = getAddAddTriples(range);
        if(triples.length == 0) {
            return;
        }

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, tpl, r, range, format3AddAdd, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomAddAddTriple(range);
            if(addResult(ra, tpl, r, range, format3AddAdd, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function generate3AddAddDiff(ra, range, qty, templates) {
    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };
    if(range <= 10) {
        var triples = getAddAddTriples(range);
        if(triples.length == 0) {
            return;
        }

        var tmp = [];
        for(var i = 0; i < triples.length; i++) {
            var tr = triples[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: tr.a,
                    b: tr.b,
                    c: tr.c,
                    t: templates[j]
                });
            }
        }

        triples = tmp;

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, r.t, r, range, format3AddAdd, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomAddAddTriple(range);
            var tpl = templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format3AddAdd, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function isInequation(tpl) {
    if(tpl.indexOf("?") > 0) {
        return 1;
    } else if(tpl.indexOf("!") > 0) {
        return -1;
    }

    return 0;
}

function getSign(iq, lt, gt) {
    var sg;
    if(lt && gt) {
        sg = rand(2);
    } else if(lt) {
        sg = 1;
    } else if(gt) {
        sg = 2;
    } else {
        return null;
    }

    if(iq > 0) {
        return sg == 1 ? "<" : ">";
    } else {
        return sg == 1 ? ">" : "<";
    }
}

function format3AddAdd(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    var iq = isInequation(tpl);
    if(iq) {
        var start = range <= 10 ? 1 : 2;
        var sg = getSign(iq, false, r.b < (range - r.a - r.c - start));
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.c).replace("d", r.a + r.b + r.c);
}

function getAddSubTriples(range) {
    var arr = [];
    var start = range <= 10 ? 1 : Math.ceil(range * 0.225);
    var end = range <= 10 ? (range - 1) : (range - 2);
    for(var i = start; i <= end; i++) {
        for(var j = start; j <= end; j++) {
            var s = i + j;
            if(range < s) {
                break;
            }

            for(var k = start, n = s - start; k <= n; k++) {
                if(i != k && j != k) {
                    arr.push({
                        a: i,
                        b: j,
                        c: k
                    });
                }
            }
        }
    }

    return arr;
}

function getRandomAddSubTriple(range) {
    var start = range <= 10 ? 1 : Math.ceil(range * 0.225);
    var a = (start - 1) + rand(range - start - (start - 1));
    var b = (start - 1) + rand(range - a - (start - 1));
    var s = a + b - start;

    var c;
    do {
        c = (start - 1) + rand(s - (start - 1));
    } while ((c == a || c == b) && s > c);

    return {
        a: a,
        b: b,
        c: c
    };
}

function generate3AddSubNormal(ra, range, qty, tpl) {
    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };
    if(range <= 100) {
        var triples = getAddSubTriples(range);
        if(triples.length == 0) {
            return;
        }

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, tpl, r, range, format3AddSub, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomAddSubTriple(range);
            if(addResult(ra, tpl, r, range, format3AddSub, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function generate3AddSubDiff(ra, range, qty, templates) {
    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };
    if(range <= 30) {
        var triples = getAddSubTriples(range);
        if(triples.length == 0) {
            return;
        }

        var tmp = [];
        for(var i = 0; i < triples.length; i++) {
            var tr = triples[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: tr.a,
                    b: tr.b,
                    c: tr.c,
                    t: templates[j]
                });
            }
        }

        triples = tmp;

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, r.t, r, range, format3AddSub, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomAddSubTriple(range);
            var tpl = templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format3AddSub, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function format3AddSub(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    var iq = isInequation(tpl);
    if(iq) {
        var start = range <= 10 ? 1 : 2;
        var sg = getSign(iq, r.b > start && r.a > r.c, r.b < (range - r.a - start) && r.a < r.c);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.c).replace("d", r.a + r.b - r.c);
}

function getOwnFactors(d) {
    var arr = [];
    for(var j = 2; j < d; j++) {
        if((d % j) == 0) {
            arr.push(j);
        }
    }

    return arr;
}

function getAddMulTriples(pos, range) {
    var triples = [];
    var start = range <= 10 ? 0 : Math.floor(pos * 0.2);
    for(var i = start; i <= pos; i++) {
        var bc = NON_PRIMES[i];
        var factors = getOwnFactors(bc);
        for(var j = 0; j < factors.length; j++) {
            var b = factors[j];
            var c = bc / b;
            var min = range <= 10 ? rand(2) : Math.ceil(range * 0.15);
            var n = range - bc;
            for(var a = min; a <= n; a++) {
                triples.push({
                    a: a,
                    b: b,
                    c: c
                });
            }
        }
    }

    return triples;
}

function getRandomAddMulTriple(pos, range) {
    var start = range <= 10 ? 0 : Math.floor(pos * 0.2);
    var idx = start + rand(pos - start) - 1;
    var bc = NON_PRIMES[idx];
    var factors = getOwnFactors(bc);
    var b = factors[rand(factors.length) - 1];
    var c = bc / b;
    var mx = bc + rand(range - bc);
    var a = mx - bc;

    return {
        a: a,
        b: b,
        c: c
    };
}

function generate3AddMulNormal(ra, range, qty, tpl) {
    var pos = binarySearch(NON_PRIMES, range <= 10 ? range - 1 : range - 2);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    if(range <= 50) {
        var triples = getAddMulTriples(pos, range);
        if(triples.length == 0) {
            return;
        }

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, tpl, r, range, format3AddMul, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomAddMulTriple(pos, range);
            if(addResult(ra, tpl, r, range, format3AddMul, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function generate3AddMulDiff(ra, range, qty, templates) {
    var pos = binarySearch(NON_PRIMES, range <= 10 ? range - 1 : range - 2);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    if(range <= 20) {
        var triples = getAddMulTriples(pos, range);
        if(triples.length == 0) {
            return;
        }

        var tmp = [];
        for(var i = 0; i < triples.length; i++) {
            var tr = triples[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: tr.a,
                    b: tr.b,
                    c: tr.c,
                    t: templates[j]
                });
            }
        }

        triples = tmp;

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, r.t, r, range, format3AddMul, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomAddMulTriple(pos, range);
            var tpl = templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format3AddMul, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function format3AddMul(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    var iq = isInequation(tpl);
    if(iq) {
        var start = range <= 10 ? 1 : 2;
        var sg = getSign(iq, false, (r.a + (r.b + 1) * r.c) <= range);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.c).replace("d", r.a + r.b * r.c);
}

function getAddDivTriples(pos, range) {
    var triples = [];
    var start = range <= 10 ? 0 : Math.floor(pos * 0.3);
    for(var i = start; i <= pos; i++) {
        var b = NON_PRIMES[i];
        var factors = getOwnFactors(b);
        for(var j = 0; j < factors.length; j++) {
            var c = factors[j];
            var bdc = b / c;
            var min = range <= 10 ? rand(2) : Math.ceil(range * 0.15);
            var n = range - bdc;
            for(var a = min; a <= n; a++) {
                triples.push({
                    a: a,
                    b: b,
                    c: c
                });
            }
        }
    }

    return triples;
}

function getRandomAddDivTriple(pos, range) {
    var start = range <= 10 ? 0 : Math.floor(pos * 0.3);
    var idx = start + rand(pos - start) - 1;
    var b = NON_PRIMES[idx];
    var factors = getOwnFactors(b);
    var c = factors[rand(factors.length) - 1];
    var bdc = b / c;
    var mx = bdc + rand(range - bdc);
    var a = mx - bdc;

    return {
        a: a,
        b: b,
        c: c
    };
}

function generate3AddDivNormal(ra, range, qty, tpl) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    if(range <= 50) {
        var triples = getAddDivTriples(pos, range);
        if(triples.length == 0) {
            return;
        }

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, tpl, r, range, format3AddDiv, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomAddDivTriple(pos, range);
            if(addResult(ra, tpl, r, range, format3AddDiv, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function generate3AddDivDiff(ra, range, qty, templates) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    if(range <= 20) {
        var triples = getAddDivTriples(pos, range);
        if(triples.length == 0) {
            return;
        }

        var tmp = [];
        for(var i = 0; i < triples.length; i++) {
            var tr = triples[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: tr.a,
                    b: tr.b,
                    c: tr.c,
                    t: templates[j]
                });
            }
        }

        triples = tmp;

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, r.t, r, range, format3AddDiv, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomAddDivTriple(pos, range);
            var tpl = templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format3AddDiv, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function format3AddDiv(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    var iq = isInequation(tpl);
    if(iq) {
        var start = range <= 10 ? 1 : 2;
        var sg = getSign(iq, r.b > start * r.c, (r.a + (r.b + r.c) / r.c) <= range);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.c).replace("d", r.a + r.b / r.c);
}

function getSubAddTriples(range) {
    var arr = [];
    var start = range <= 10 ? 1 : Math.ceil(range * 0.225);
    var end = range <= 10 ? (range - 1) : (range - 2);
    for(var i = start; i <= end; i++) {
        for(var j = start, n = i - start; j <= n; j++) {
            var s = i - j;
            for(var k = start; k <= end; k++) {
                if(range < (s + k)) {
                    break;
                }

                if(i != k && j != k) {
                    arr.push({
                        a: i,
                        b: j,
                        c: k
                    });
                }
            }
        }
    }

    return arr;
}

function getRandomSubAddTriple(range) {
    var start = range <= 10 ? 1 : Math.ceil(range * 0.225);
    var a = (start - 1) + rand(range - (start - 1));
    var b = (start - 1) + rand(a - start - (start - 1));
    var s = range - (a - b);

    var c;
    do {
        c = (start - 1) + rand(s - (start - 1));
    } while (c == b && s > c);

    return {
        a: a,
        b: b,
        c: c
    };
}

function generate3SubAddNormal(ra, range, qty, tpl) {
    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };
    if(range <= 100) {
        var triples = getSubAddTriples(range);
        if(triples.length == 0) {
            return;
        }

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, tpl, r, range, format3SubAdd, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomSubAddTriple(range);
            if(addResult(ra, tpl, r, range, format3SubAdd, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function generate3SubAddDiff(ra, range, qty, templates) {
    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };
    if(range <= 30) {
        var triples = getSubAddTriples(range);
        if(triples.length == 0) {
            return;
        }

        var tmp = [];
        for(var i = 0; i < triples.length; i++) {
            var tr = triples[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: tr.a,
                    b: tr.b,
                    c: tr.c,
                    t: templates[j]
                });
            }
        }

        triples = tmp;

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, r.t, r, range, format3SubAdd, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomSubAddTriple(range);
            var tpl = templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format3SubAdd, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function format3SubAdd(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    var iq = isInequation(tpl);
    if(iq) {
        var start = range <= 10 ? 1 : 2;
        var sg = getSign(iq, r.b < (r.a - start) && r.b > 0, r.b > start && (r.a - (r.b - start) + r.c) <= range);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.c).replace("d", r.a - r.b + r.c);
}

function getMulSubTriples(pos, range) {
    var triples = [];
    var start = range <= 10 ? 0 : Math.floor(pos * 0.3);
    for(var i = start; i <= pos; i++) {
        var ab = NON_PRIMES[i];
        var factors = getOwnFactors(ab);
        for(var j = 0; j < factors.length; j++) {
            var a = factors[j];
            var b = ab / a;
            var min = range <= 10 ? rand(2) : Math.ceil(ab * 0.15);
            var n = ab - min;
            for(var c = min; c <= n; c++) {
                triples.push({
                    a: a,
                    b: b,
                    c: c
                });
            }
        }
    }

    return triples;
}

function getRandomMulSubTriple(pos, range) {
    var start = range <= 10 ? 0 : Math.floor(pos * 0.3);
    var idx = start + rand(pos - start) - 1;
    var ab = NON_PRIMES[idx];
    var factors = getOwnFactors(ab);
    var a = factors[rand(factors.length) - 1];
    var b = ab / a;
    var c = rand(ab);

    return {
        a: a,
        b: b,
        c: c
    };
}

function generate3MulSubNormal(ra, range, qty, tpl) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    if(range <= 100) {
        var triples = getMulSubTriples(range);
        if(triples.length == 0) {
            return;
        }

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, tpl, r, range, format3MulSub, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomMulSubTriple(pos, range);
            if(addResult(ra, tpl, r, range, format3MulSub, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function generate3MulSubDiff(ra, range, qty, templates) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    if(range <= 30) {
        var triples = getMulSubTriples(range);
        if(triples.length == 0) {
            return;
        }

        var tmp = [];
        for(var i = 0; i < triples.length; i++) {
            var tr = triples[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: tr.a,
                    b: tr.b,
                    c: tr.c,
                    t: templates[j]
                });
            }
        }

        triples = tmp;

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, r.t, r, range, format3MulSub, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomMulSubTriple(pos, range);
            var tpl = templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format3MulSub, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function format3MulSub(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    var iq = isInequation(tpl);
    if(iq) {
        var start = range <= 10 ? 1 : 2;
        var sg = getSign(iq, r.b > start && r.a * (r.b - 1) >= r.c, r.a * (r.b + 1) <= range);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.c).replace("d", r.a * r.b - r.c);
}

function getMulMulTriples(pos) {
    var factorMap = {};
    for(var i = 0; i <= pos; i++) {
        var d = NON_PRIMES[i];
        factorMap[d] = getOwnFactors(d);
    }

    var triples = [];
    for(var i = 0; i <= pos; i++) {
        var d = NON_PRIMES[i];
        for(var x = 2; x < d; x++) {
            if((d % x) == 0) {
                var y = d / x;
                var fx = factorMap[x];
                if(fx) {
                    for(var j = 0; j < fx.length; j++) {
                        var a = fx[j];
                        var b = x / a;
                        triples.push({
                            a: a,
                            b: b,
                            c: y
                        });
                    }
                }
                var fy = factorMap[y];
                if(fy) {
                    for(var j = 0; j < fy.length; j++) {
                        var b = fy[j];
                        var c = y / b;
                        if(a != c && b != c) {
                            triples.push({
                                a: x,
                                b: b,
                                c: c
                            });
                        }
                    }
                }
            }
        }
    }

    return triples;
}

function generate3MulMulNormal(ra, range, qty, tpl) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var triples = getMulMulTriples(pos);
    if(triples.length == 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < triples.length) {
        var cadidates = triples.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            if(addResult(ra, tpl, r, range, format3MulMul, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function generate3MulMulDiff(ra, range, qty, templates) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var triples = getMulMulTriples(pos);
    if(triples.length == 0) {
        return;
    }

    var total = triples.length * templates.length;
    if(total < 1000) {
        var tmp = [];
        for(var i = 0; i < triples.length; i++) {
            var tr = triples[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: tr.a,
                    b: tr.b,
                    c: tr.c,
                    t: templates[j]
                });
            }
        }

        triples = tmp;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < triples.length) {
        var cadidates = triples.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            var tpl = r.t ? r.t : templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format3MulMul, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function format3MulMul(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    var iq = isInequation(tpl);
    if(iq) {
        var start = range <= 10 ? 1 : 2;
        var sg = getSign(iq, r.b > start, r.a * (r.b + 1) * r.c <= range);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.c).replace("d", r.a * r.b * r.c);
}

function getMulDivTriples(pos) {
    var triples = [];
    for(var i = 0; i <= pos; i++) {
        var d = NON_PRIMES[i];
        var fx = getOwnFactors(d);
        if(fx.length > 2) {
            for(var j = 0; j < fx.length; j++) {
                var a = fx[j];
                var b = d / a;

                for(var k = 0; k < fx.length; k++) {
                    var c = fx[k];
                    if(c != a && c != b) {
                        triples.push({
                            a: a,
                            b: b,
                            c: c
                        });
                    }
                }
            }
        }
    }

    return triples;
}

function generate3MulDivNormal(ra, range, qty, tpl) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var triples = getMulDivTriples(pos);
    if(triples.length == 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < triples.length) {
        var cadidates = triples.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            if(addResult(ra, tpl, r, range, format3MulDiv, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function generate3MulDivDiff(ra, range, qty, templates) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var triples = getMulDivTriples(pos);
    if(triples.length == 0) {
        return;
    }

    var total = triples.length * templates.length;
    if(total < 1000) {
        var tmp = [];
        for(var i = 0; i < triples.length; i++) {
            var tr = triples[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: tr.a,
                    b: tr.b,
                    c: tr.c,
                    t: templates[j]
                });
            }
        }

        triples = tmp;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < triples.length) {
        var cadidates = triples.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            var tpl = r.t ? r.t : templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format3MulDiv, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function format3MulDiv(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    var iq = isInequation(tpl);
    if(iq) {
        var start = range <= 10 ? 1 : 2;
        var n = Math.ceil(range / r.c);
        var arr = []; // b的所有可能值
        for(var i = 1; i <= n; i++) {
            var t = i * r.c;
            if(t % r.a == 0) {
                arr.push(t / r.a);
            }
        }

        var sg = getSign(iq, arr.length > 0 && r.b != arr[0] && r.a > r.c, arr.length > 0 && r.b != arr[arr.length - 1] && r.a < r.c);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.c).replace("d", r.a * r.b / r.c);
}

function getDivSubTriples(pos, range) {
    var triples = [];
    var start = range <= 10 ? 0 : Math.floor(pos * 0.3);
    for(var i = start; i <= pos; i++) {
        var a = NON_PRIMES[i];
        var factors = getOwnFactors(a);
        for(var j = 0; j < factors.length; j++) {
            var b = factors[j];
            var adb = a / b;
            var min = range <= 10 ? rand(2) : Math.ceil(adb * 0.15);
            var n = adb - min;
            for(var c = min; c <= n; c++) {
                triples.push({
                    a: a,
                    b: b,
                    c: c
                });
            }
        }
    }

    return triples;
}

function getRandomDivSubTriple(pos, range) {
    var start = range <= 10 ? 0 : Math.floor(pos * 0.3);
    var idx = start + rand(pos - start) - 1;
    var a = NON_PRIMES[idx];
    var factors = getOwnFactors(a);
    var b = factors[rand(factors.length) - 1];
    var adb = a / b;
    var c = rand(adb);

    return {
        a: a,
        b: b,
        c: c
    };
}

function generate3DivSubNormal(ra, range, qty, tpl) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    if(range <= 100) {
        var triples = getDivSubTriples(range);
        if(triples.length == 0) {
            return;
        }

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, tpl, r, range, format3DivSub, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomDivSubTriple(pos, range);
            if(addResult(ra, tpl, r, range, format3DivSub, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function generate3DivSubDiff(ra, range, qty, templates) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    if(range <= 30) {
        var triples = getDivSubTriples(range);
        if(triples.length == 0) {
            return;
        }

        var tmp = [];
        for(var i = 0; i < triples.length; i++) {
            var tr = triples[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: tr.a,
                    b: tr.b,
                    c: tr.c,
                    t: templates[j]
                });
            }
        }

        triples = tmp;

        while(qty > 0 && (collected.count + ignored.count) < triples.length) {
            var cadidates = triples.slice(0);
            while(cadidates.length > 0) {
                var idx = rand(cadidates.length) - 1;
                var r = cadidates[idx];
                if(addResult(ra, r.t, r, range, format3DivSub, collected, ignored) && --qty <= 0) {
                    break;
                }

                cadidates.splice(idx, 1);
            }
        }
    } else {
        while(qty > 0) {
            var r = getRandomDivSubTriple(pos, range);
            var tpl = templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format3DivSub, collected, ignored) && --qty <= 0) {
                break;
            }
        }
    }
}

function format3DivSub(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    var iq = isInequation(tpl);
    if(iq) {
        var start = range <= 10 ? 1 : 2;
        var factors = getOwnFactors(r.a);

        var nxt = null;
        for(var i = 0; i < factors.length; i++) {
            if(factors[i] > r.b) {
                nxt = factors[i];
                break;
            }
        }

        // b不是a的最大因子，且下一个因子满足条件，可升（即等式左边可降）；
        // b不是a的最小因子，可降（即等式左边可升）；
        var sg = getSign(iq, nxt && (r.a * nxt) > r.c, r.b != factors[0]);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.c).replace("d", r.a / r.b - r.c);
}

function getDivMulTriples(pos, range) {
    var triples = [];
    for(var i = 0; i <= pos; i++) {
        var a = NON_PRIMES[i];
        var fx = getOwnFactors(a);
        if(fx.length > 1) {
            for(var j = 0; j < fx.length; j++) {
                var b = fx[j];
                var adb = a / b;

                for(var k = 0; k < fx.length; k++) {
                    var c = fx[k];
                    if(c == b) {
                        continue;
                    }

                    if(range < (adb * c)) {
                        break;
                    }

                    triples.push({
                        a: a,
                        b: b,
                        c: c
                    });
                }
            }
        }
    }

    return triples;
}

function generate3DivMulNormal(ra, range, qty, tpl) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var triples = getDivMulTriples(pos, range);
    if(triples.length == 0) {
        return;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < triples.length) {
        var cadidates = triples.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            if(addResult(ra, tpl, r, range, format3DivMul, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function generate3DivMulDiff(ra, range, qty, templates) {
    var pos = binarySearch(NON_PRIMES, range);
    if(pos < 0) {
        pos = -pos - 2;
    }

    if(pos < 0) {
        return;
    }

    var triples = getDivMulTriples(pos, range);
    if(triples.length == 0) {
        return;
    }

    var total = triples.length * templates.length;
    if(total < 1000) {
        var tmp = [];
        for(var i = 0; i < triples.length; i++) {
            var tr = triples[i];
            for(var j = 0; j < templates.length; j++) {
                tmp.push({
                    a: tr.a,
                    b: tr.b,
                    c: tr.c,
                    t: templates[j]
                });
            }
        }

        triples = tmp;
    }

    var collected = {
        count: 0
    };
    var ignored = {
        count: 0
    };

    while(qty > 0 && (collected.count + ignored.count) < triples.length) {
        var cadidates = triples.slice(0);
        while(cadidates.length > 0) {
            var idx = rand(cadidates.length) - 1;
            var r = cadidates[idx];
            var tpl = r.t ? r.t : templates[rand(templates.length) - 1];
            if(addResult(ra, tpl, r, range, format3DivMul, collected, ignored) && --qty <= 0) {
                break;
            }

            cadidates.splice(idx, 1);
        }
    }
}

function format3DivMul(tpl, r, range) {
    var s = tpl;
    var ignored = false;
    var iq = isInequation(tpl);
    if(iq) {
        var start = range <= 10 ? 1 : 2;
        var factors = getOwnFactors(r.a);

        var prv = null;
        for(var i = 0; i < factors.length; i++) {
            if(factors[i] < r.b) {
                prv = factors[i];
                break;
            }
        }

        // b不是a的最大因子，可升（即等式左边可降）；
        // b不是a的最小因子，且下一个因子满足条件，可降（即等式左边可升）；
        var sg = getSign(iq, r.b != factors[factors.length - 1], prv && (r.a / prv * r.c) <= range);
        if(!sg) {
            return null;
        }

        s = tpl.replace(/[\?\!]/g, sg);
    }

    return s.replace("a", r.a).replace("b", r.b).replace("c", r.c).replace("d", r.a / r.b * r.c);
}

function generate4(ra) {
    var sa = [];
    if(CONFIG.add) {
        sa.push("Add");
    }
    if(CONFIG.sub) {
        sa.push("Sub");
    }
    if(CONFIG.mul) {
        sa.push("Mul");
    }
    if(CONFIG.div) {
        sa.push("Div");
    }

    var tms = {
        "AddAdd": {
            "forward": "AddSub",
            "normal": ["()+b=c+d", "a+()=c+d", "a+b=()+d", "a+b=c+()"],
            "blank": ["a+()=c+()"],
            "sign": ["()○b=c+d", "()+b=c○d", "a○b=c○d"],
            "inequal": ["a+()?c+()"]
        },
        "AddSub": {
            "forward": "AddAdd",
            "normal": ["()+b=d-c", "a+()=d-c", "a+b=()-c", "a+b=d-()"],
            "blank": ["a+()=()-c", "a+()=d-()"],
            "sign": ["()○b=d-c", "()+b=d○c", "a○b=d○c"],
            "inequal": ["a+()?()-c", "a+()?d-()"]
        },
        "AddMul": {
            "forward": "MulSub",
            "normal": ["()+d=a×b", "c+()=a×b", "c+d=()×b", "c+d=a×()"],
            "blank": ["c+()=a×()"],
            "sign": ["()○d=a×b", "()+d=a○b", "c○d=a○b"],
            "inequal": ["c+()!a×()"]
        },
        "AddDiv": {
            "forward": "DivSub",
            "normal": ["()+d=a÷b", "c+()=a÷b", "c+d=()÷b", "c+d=a÷()"],
            "blank": ["c+()=a÷()", "c+()=()÷b"],
            "sign": ["()○d=a÷b", "()+d=a○b", "c○d=a○b"],
            "inequal": ["c+()!a÷()"]
        },
        "SubAdd": {
            "forward": "AddAdd",
            "normal": ["()-a=b+c", "d-()=b+c", "d-a=()+c", "d-a=b+()"],
            "blank": ["()-a=()+c", "d-()=()+c"],
            "sign": ["()○a=b+c", "()-a=b○c", "d○a=b○c"],
            "inequal": ["()-a!()+c", "d-()!()+c"]
        },
        "SubSub": {
            "forward": "SubAdd",
            "normal": ["()-b=d-c", "a-()=d-c", "a-b=()-c", "a-b=d-()"],
            "blank": ["a-()=()-c", "a-()=d-()"],
            "sign": ["()○b=d-c", "()-b=d○c", "a○b=d○c"],
            "inequal": ["a-()?()-c", "a-()?d-()"]
        },
        "SubMul": {
            "forward": "AddMul",
            "normal": ["()-a=b×c", "d-()=b×c", "d-a=()×c", "d-a=b×()"],
            "blank": ["()-a=()×c", "d-()=()×c"],
            "sign": ["()○a=b×c", "()-a=b○c", "d○a=b○c"],
            "inequal": ["()-a!()×c", "d-()!()×c"]
        },
        "SubDiv": {
            "forward": "AddDiv",
            "normal": ["()-a=b÷c", "d-()=b÷c", "d-a=()÷c", "d-a=b÷()"],
            "blank": ["()-a=()÷c", "d-()=()÷c", "()-a=b÷()", "d-()=b÷()"],
            "sign": ["()○a=b÷c", "()-a=b○c", "d○a=b○c"],
            "inequal": ["()-a!()÷c", "d-()!()÷c"]
        },
        "MulAdd": {
            "forward": "MulSub",
            "normal": ["()×b=c+d", "a×()=c+d", "a×b=()+d", "a×b=c+()"],
            "blank": ["a×()=c+()"],
            "sign": ["()○b=c+d", "()×b=c○d", "a○b=c○d"],
            "inequal": ["a×()?c+()"]
        },
        "MulSub": {
            "forward": "AddMul",
            "normal": ["()×c=d-a", "b×()=d-a", "b×c=()-a", "b×c=d-()"],
            "blank": ["()×c=()-a", "()×c=d-()"],
            "sign": ["()○c=d-a", "()×c=d○a", "d○c=b○a"],
            "inequal": ["()×c?()-a", "()×c?d-()"]
        },
        "MulMul": {
            "forward": "MulDiv",
            "normal": ["()×b=c×d", "a×()=c×d", "a×b=()×d", "a×b=c×()"],
            "blank": ["a×()=c×()"],
            "sign": ["()○b=c×d", "()×b=c○d", "a○b=c○d"],
            "inequal": ["a×()?c×()"]
        },
        "MulDiv": {
            "forward": "MulMul",
            "normal": ["()×b=d÷c", "a×()=d÷c", "a×b=()÷c", "a×b=d÷()"],
            "blank": ["a×()=()÷c", "a×()=d÷()"],
            "sign": ["()○b=d÷c", "()×b=d○c", "a○b=d○c"],
            "inequal": ["a×()?()÷c", "a×()?d÷()"]
        },
        "DivAdd": {
            "forward": "DivSub",
            "normal": ["()÷b=c+d", "a÷()=c+d", "a÷b=()+d", "a÷b=c+()"],
            "blank": ["a÷()=c+()", "()÷b=c+()"],
            "sign": ["()○b=c+d", "()÷b=c○d", "a○b=c○d"],
            "inequal": ["a÷()?c+()"]
        },
        "DivSub": {
            "forward": "AddDiv",
            "normal": ["()÷c=d-a", "b÷()=d-a", "b÷c=()-a", "b÷c=d-()"],
            "blank": ["()÷c=()-a", "()÷c=d-()", "b÷()=()-a", "b÷()=d-()"],
            "sign": ["()○c=d-a", "()÷c=d○a", "b○c=d○a"],
            "inequal": ["()÷c?()-a", "()÷c?d-()"]
        },
        "DivMul": {
            "forward": "MulMul",
            "normal": ["()÷a=b×c", "d÷()=b×c", "d÷a=()×c", "d÷a=b×()"],
            "blank": ["()÷a=()×c", "d÷()=()×c"],
            "sign": ["()○a=b×c", "()÷a=b○c", "d○a=b○c"],
            "inequal": ["()÷a!()×c", "d÷()!()×c"]
        },
        "DivDiv": {
            "forward": "DivMul",
            "normal": ["()÷b=d÷c", "a÷()=d÷c", "a÷b=()÷c", "a÷b=d÷()"],
            "blank": ["()÷b=()÷c", "()÷b=d÷()", "a÷()=()÷c", "a÷()=d÷()"],
            "sign": ["()○b=d÷c", "()÷b=d○c", "a○b=d○c"],
            "inequal": ["a÷()?()÷c", "a÷()?d÷()"]
        }
    };

    var qty = CONFIG.q4;
    var q = Math.floor(qty / (sa.length * sa.length));
    for(var i = 0; i < sa.length; i++) {
        for(var j = 0; j < sa.length; j++) {
            callGenerate4(ra, sa[i] + sa[j], q, tms[sa[i] + sa[j]]);
            qty -= q;
        }
    }

    if(qty > 0) {
        var i = rand(sa.length) - 1;
        var j = rand(sa.length) - 1;
        callGenerate4(ra, sa[i] + sa[j], qty, tms[sa[i] + sa[j]]);
    }
}

function callGenerate4(ra, cal, qty, tm) {
    if(tm["forward"]) {
        cal = tm["forward"];
    }

    var qbQty = Math.floor(qty * CONFIG.qb);
    var qiQty = Math.floor(qty * CONFIG.qi);
    var qsQty = Math.floor(qty * CONFIG.qs);
    var nmQty = qty - qbQty - qiQty - qsQty;

    if(nmQty > 0) {
        eval("generate3" + cal + "Diff(ra, CONFIG.range, nmQty, tm['normal'])");
    }

    if(qbQty > 0) {
        eval("generate3" + cal + "Diff(ra, CONFIG.range, qbQty, tm['blank'])");
    }

    if(qiQty > 0) {
        eval("generate3" + cal + "Diff(ra, CONFIG.range, qiQty, tm['inequal'])");
    }

    if(qsQty > 0) {
        eval("generate3" + cal + "Diff(ra, CONFIG.range, qsQty, tm['sign'])");
    }
}