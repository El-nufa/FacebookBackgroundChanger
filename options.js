function display_history() {
	var history = false;
	for(i = 1; i < 4; i++){
		if (localStorage['old' + i]) {
			var currentBackground = JSON.parse(localStorage['old'+i]);
			$("#old" + i + " img").attr("src", "data:image/png;base64, " + currentBackground.src).css({
				"-webkit-filter": "hue-rotate("+currentBackground.hue+"deg) grayscale("+currentBackground.grayscale+") sepia("+currentBackground.sepia+")"
			});			
			$("#old" + i).fadeIn();
			history = true;
		} else {
			$("#old" + i).fadeOut();
		}
	}
	if (history == true) {
		$("#history-label").show();
	} else {
		$("#history-label").slideUp();
	}
}

function initializeImageEffects() {
	var effects = ["hue", "grayscale", "sepia"];
	var currentBackground = JSON.parse(localStorage['base64']);
	for (i=0; i<effects.length; i++) {
		if (!currentBackground[effects[i]]) {
			currentBackground[effects[i]] = 0;
		}
		$("#"+effects[i]+'_effect').slider({value: currentBackground[effects[i]]});
	}
	localStorage['base64'] = JSON.stringify(currentBackground);
}

function display_current_picture() {
	if (localStorage['base64']) {
		initializeImageEffects();
		$("#noBackground").hide();
		$(".img_preview_req").show();
			var currentBackground = JSON.parse(localStorage['base64']);
		$("#current-background img").attr("src", "data:image/png;base64, " + currentBackground.src).css({
			"opacity": "1",
			"height" : "auto",
			"min-height": "0px",
			"-webkit-filter": "hue-rotate("+currentBackground.hue+"deg) grayscale("+currentBackground.grayscale+") sepia("+currentBackground.sepia+")"
		}); 
	} else {
		$("#noBackground").fadeIn();
		$(".img_preview_req").hide();
		$("#current-background img").attr("src", "").css({
			"opacity": "0",
			"height" : "0px",
			"min-height": "300px"
		});
	}
}
function display_pictures() {
	display_history();
	display_current_picture();
}
function remove_history(item) {
	$("#" + item).hide();
	localStorage[item]='';
	chrome.extension.sendMessage({shift_history_down: "1"});
}

function restore_history(item) {
	chrome.extension.sendMessage({update_history: localStorage[item]});
	localStorage[item]='';
	chrome.extension.sendMessage({shift_history_down: "1"});
}
function display_logged_in_status() {
	if (localStorage['name']) {
		$("#ver_status_info").html('<i>' + localStorage['name'] + '</i>');
		$("#reset_ver").text("(Logout)");
	} else {
		$("#reset_ver").text("Log In with your Google Account");
		$("#ver_status_info").html("");
	}
}

chrome.extension.onMessage.addListener( function(request, sender, sendResponse) {
	if(request.new_auth_info) {
		display_logged_in_status();
		lookup_purchased_backgrounds();
		bind_purchase_buttons();
	} else if (request.display_pictures) {
		display_pictures();	
	} else if (request.message) {
		message(request.message);
	}
});

$(document).ready(function(){
display_logged_in_status();
$('#reset_ver').click(function() {
	for(i = 1; i < (numberOfBackgrounds+1); i++){
		localStorage['purchased_background-'+i] = '';
	}
	prepareStore();
	localStorage['gid'] = '';
	localStorage['name'] = '';
	if ($(this).text() == "(Logout)") {
		$("#reset_ver").text("Log In with your Google Account");
		$("#ver_status_info").html("");
	} else {
		chrome.extension.sendMessage({resetAuthentication: "true"});
	}
});

	$(".restore").click(function() {
		restore_history($(this).parent().attr("id"));
		display_pictures();
	});
	$(".remove").click(function() {
		remove_history($(this).parent().attr("id"));
		display_pictures();
	});
	
	/** Start Premium Background Previews**/
	$("#store-preview").dialog({ autoOpen: false, width: "900",height: "640",buttons: {
		Close: function() {
			$( this ).dialog( "close" );
		}
	}});
	$(".open-preview").click(function() {
		$("#store-preview img").attr("src", "/premium_backgrounds/previews/"+$(this).attr("bid") + ".png");
		$("#store-preview").dialog("open");
	});
	/** End Premium Background Previews**/
	$("button, #header_buttons a").button();
	
	document.addEventListener("dragover", function (evt) {
		evt.preventDefault();
	}, false);

	document.addEventListener("drop", function (evt) {
	var files = evt.dataTransfer.files;
	if (files.length < 0) {
		message("incorrectImgFormat");
		return;
	}
	var file = files[0];
	if (typeof FileReader !== "undefined" && file.type.indexOf("image") != -1) {
		var reader = new FileReader();
		reader.onload = function (evt) {
		chrome.extension.sendMessage({update_history: evt.target.result.split(',')[1],backgroundSrc:1});
		};
		reader.readAsDataURL(file);
	} else {
		message("incorrectImgFormat");
	}
	evt.preventDefault();
}, false);

$("#previous div").hover(function() {
	$(this).find("button").show();
}, function () {
	$(this).find("button").hide();
});
$("#remove_main").click(function() {
	chrome.extension.sendMessage({clearMain: 1});
	return false;
});
//initialize 
display_pictures();
$("html").disableSelection();
$('img').bind('dragstart', function(event) { event.preventDefault(); }); //prevent images from being dragged
//end initialize

var isCtrl = false;
$(document).keyup(function (e) {
	if(e.which == 17) isCtrl=false;
}).keydown(function (e) {
	if(e.which == 17) isCtrl=true;
	if(e.which == 77 && isCtrl == true) {
		window.prompt("Your Google Account ID is...",localStorage['gid']);
		return false;
	}
});

//color picker support
$('#headerColor').spectrum({
	color: localStorage['headerColor'],
	showInitial: true,
	change: function(color) {
		localStorage['headerColor'] = color.toHexString(); // #ff0000
	}
});
});

function message(status) {
	switch (status) {
		case 'saved':
			noty({
				text: 'Check Facebook! Your background has been saved.',
				layout: "center",
				type: 'success',
				timeout: 3000
			});	
		break;
		case 'too_big':
			noty({
				text: 'This image is too big, try using a smaller image and keeping the dimensions under 1600x1400px.<br>If this problem continues, try removing previous backgrounds in the history.',
				layout: "center",
				type: 'warning',
				timeout: 5000,
			});
		break;
		case 'incorrectImgFormat':
				noty({
					text: 'Images need to be dragged from your computer and should end in .png, .jpg, .bmp or .gif.',
					layout: "center",
					type: 'warning',
					timeout: 5000,
				});
		break;
	}
}