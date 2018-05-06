// 获取导航节点
var nav = $('.selfnav');

// 设置初始位置
var winTop_1 = nav.outerHeight();

// 判断滚动条
$(window).on('scroll', function() {
	// 滚动条距离顶部距离
	var winTop_2 = $(window).scrollTop();
	if(winTop_2 > winTop_1) { // 鼠标向下滑动，隐藏导航条
		nav.slideUp("normal");
	} else if(winTop_2 < winTop_1) { // 鼠标向上滑动，显示导航条
		nav.slideDown("normal");
	}
	// 滚动后距离赋值
	winTop_1 = $(window).scrollTop();
})