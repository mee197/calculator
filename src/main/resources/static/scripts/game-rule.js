/**
 * 
 * @link https://www.hbuecx.club/exercise
 * 
 * @author chenxin
 * 
 * @description 游戏计时器，使用时只需要规定每分钟消耗多少积分prescore、最长玩游戏时间max_time即可
 * 
 */


//绘制计时计分信息
var gameinfo = '<div class="game-info-main">' +
	'<div class="info-module">' +
	'<p class="use-time">' +
	'您已用时：<span><strong>00:00:00</strong></span>' +
	'</p>' +
	'<p class="use-score">' +
	'累计消耗：<span><strong>0分</strong></span>' +
	'</p>' +
	'</div>' +
	'<div class="game-exit">' +
	'<a href="javascript:void(0);">退出游戏</a>' +
	'</div>' +
	'</div>' +
	'<div class="rule"></div>';

$(".game-info-module").html(gameinfo);

//用于规定每分钟消耗多少分
var prescore = 1;

//用于存储最多可玩游戏多长时间
var max_time = 40 * 60;

//用于存储消耗的分数
var score = 0;

//用于存储游戏时间信息
var timemsg;

//用于存储游戏时间
var totletime = 0;
var minutes = 0;
var seconds = 0;

//页面打开即开始页面计时
var totle = setInterval("caculatortime()", 1000);

//游戏时间显示块
var use_time = $(".use-time strong");

//消耗分数显示块
var use_score = $(".use-score strong");

/**
 * 计算游戏总时间
 */
function caculatortime() {

	if(totletime < max_time) { //如果没有到最长游戏时间
		++totletime;
		minutes = Math.floor(totletime / 60);
		seconds = Math.floor(totletime % 60);
		
		if (0 == seconds) {
			score = minutes*prescore
		} else{
			score = (minutes + 1) * prescore;
		}

		if(minutes < 10) {
			if(seconds < 10) {
				timemsg = "00:0" + minutes + ":0" + seconds;
			} else {
				timemsg = "00:0" + minutes + ":" + seconds;
			}
		} else {
			if(seconds < 10) {
				timemsg = "00:" + minutes + ":0" + seconds;
			} else {
				timemsg = "00:" + minutes + ":" + seconds;
			}
		}

		use_time.text(timemsg);
		use_score.text(score + "分");
	} else { //如果达到游戏最长时间
		
		//清除计时器
		clearInterval(totle);

		alert("勤有功，戏无益！");
		
		//向后台发送数据
		
		
		//跳转至主页
		window.location.href = "/stu/index";
	}
}

/**
 * 退出游戏
 */
$(".game-exit").click(function() {
	//清除计时器
	clearInterval(totle);

	//向后台传送数据
	

	//跳转至主页
	window.location.href = "/stu/index";
});