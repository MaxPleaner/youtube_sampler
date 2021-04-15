// ==UserScript==
// @name         Youtube Sampler
// @namespace    http:/github.com/maxpleaner/youtube_sampler
// @version      0.1
// @description  sample youtube videos 
// @author       Max Pleaner
// @match        https://www.youtube.com/watch*
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// ==/UserScript==

// Thanks to https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element

(function() {

	function attachScript(src) {
		var script = document.createElement('script');
		script.setAttribute('src', src);
		document.head.appendChild(script);
	}

	// Because I'm lazy
	function addjQuery() {
		var src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js'
		attachScript(src)
	}

	// loads attributes from the youtube video player
	var video, startTime, endTime;
	function initVideo () {hi
		var $video = $("video")
		video = $video[0]

		startTime = 0
		endTime = video.duration
	}

	function loopVideo () {
		video.ontimeupdate = () => {
			if (video.currentTime > endTime) {
				video.currentTime = startTime
			}
			if (video.currentTime < startTime) {
				video.currentTime = startTime
			}
		}
	}

	function initUI ($slider1, $slider2, $boundsText, $downloadResultBtn) {
		$slider1.find("input").attr("max", video.duration).val(0)
		$slider2.find("input").attr("max", video.duration).val(video.duration)
		$boundsText.text(`${displayTime(startTime)} - ${displayTime(endTime)}`)
		$downloadResultBtn.css("display", "none")
	}

	function displayTime (floatSeconds) {
		var minutes = parseInt(floatSeconds / 60)
		var seconds = parseInt(floatSeconds - (minutes * 60))
		// var ms = floatSeconds - (minutes * 60) - seconds
		// var roundedMs = parseInt(ms * 100)

		return `${minutes}:${seconds}`
	}

	function log(msg) {
	  // logElement.innerHTML += msg + "\n";
	  console.log(msg)
	}

	var containerStyle, sliderStyle, boundsTextStyle, downloadBtnStyle,
	    $slideContainer, $slider1, $slider2, $sliders, $boundsText,
	    $downloadResultBtn
	function addUIElements () {
		containerStyle = `
		    position: fixed;
			bottom: 50px;
			padding: 10px;
			height: 50px;
			background-color: black;
			z-index: 100;
			width: 100%;
		`

		sliderStyle = `
			width: 90%;
		`

		boundsTextStyle = `
			color: white;
		`

		downloadBtnStyle = `
			color: lightblue;
			text-decoration: italic;
		`

		$slideContainer = $(`
			<div class="slidecontainer" style="${containerStyle}">
				<!-- <a id="server-download-btn" style="${downloadBtnStyle}" href='#'>download on server</a><br> -->
				<a id="client-download-btn" style="${downloadBtnStyle}" href='#'>record</a><br>
				<a id="client-download-result-btn" style="${downloadBtnStyle}; display: none;" href='#'>result</a>
				<p style="${boundsTextStyle}" id="bounds-text"></p>
			</div>
		`)

		$slider1 = $(`
		  <div>
		    <input type="range" step="1" style="${sliderStyle}" min="0" max="${video.duration}" value="0" class="slider" id="myRange">
		    <br>
		  </div>
		`)

		$slider2 = $(`
		  <div>
		    <input type="range" step="1" style="${sliderStyle}" min="0" max="${video.duration}" value="${video.duration}" class="slider" id="myRange">
		    <br>
		  </div>
		`)

		$sliders = $slideContainer.append($slider1).append($slider2)
		$boundsText = $slideContainer.find("#bounds-text")
		$boundsText.text(`${displayTime(startTime)} - ${displayTime(endTime)}`)

		$("ytd-video-primary-info-renderer").append($sliders)

		$downloadResultBtn = $("#client-download-result-btn")
	}

	function addPageChangeListener () {
		var currentPage = window.location.href
		setInterval(() => {
			if (currentPage != window.location.href) {
				currentPage = window.location.href
				initVideo()
				initUI($slider1, $slider2, $boundsText, $downloadResultBtn)
			}
		}, 2000)
	}

	function addUIEventHandlers () {
		var $input1 = $slider1.find("input")
		$input1.on("change input", () => {
			var newStart = parseFloat($input1.val())
			if (newStart >= endTime) {
		    newStart = endTime
				$input1.val(newStart)
			}
			startTime = newStart
			video.currentTime = startTime
			$boundsText.text(`${displayTime(startTime)} - ${displayTime(endTime)}`)
		})

		var $input2 = $slider2.find("input")
		$input2.on("change input", () => {
			var newEnd = parseFloat($input2.val())
			if (newEnd <= startTime) {
				newEnd = startTime
				$input2.val(newEnd)
			}
			endTime = newEnd
			// video.currentTime = startTime
			$boundsText.text(`${displayTime(startTime)} - ${displayTime(endTime)}`)
		})
	}

	function wait(delayInMS) {
	  return new Promise(resolve => setTimeout(resolve, delayInMS));
	}

	function startRecording(stream, lengthInMS, mediaType) {
	  let recorder = new MediaRecorder(stream, { mimeType: mediaType });
	  let data = [];

	  recorder.ondataavailable = event => data.push(event.data);
	  recorder.start();
	  log(recorder.state + " for " + (lengthInMS/1000) + " seconds...");

	  let stopped = new Promise((resolve, reject) => {
	    recorder.onstop = resolve;
	    recorder.onerror = event => reject(event.name);
	  });

	  let recorded = wait(lengthInMS).then(
	    () => recorder.state == "recording" && recorder.stop()
	  );

	  return Promise.all([
	    stopped,
	    recorded
	  ])
	  .then(() => data);
	}

	function addDownloadButtonListener (mediaType) {
		$("#client-download-btn").on("click", (e) => {
			e.preventDefault()

			video.currentTime = startTime

			var stream = video.captureStream()
			var durationSeconds = endTime - startTime

			video.play()

				startRecording(video.captureStream(), durationSeconds * 1000, mediaType)
			  .then (recordedChunks => {
			  	console.log(`done`)

			  	video.pause()
			    let recordedBlob = new Blob(recordedChunks, { type: mediaType });

			    $downloadResultBtn[0].href = URL.createObjectURL(recordedBlob);
			    var title = prompt("title?")
			    $downloadResultBtn[0].download = `${title}.webm`;
			    $downloadResultBtn.css("display", "inline")
			    $downloadResultBtn.trigger("click")
			  })
			  .catch((e) => { debugger });
		})
	}

	addjQuery()

	setTimeout(() => {
		initVideo()
		loopVideo()
		addUIElements()
		addUIEventHandlers()
		addPageChangeListener()
		addDownloadButtonListener("video/webm")
	}, 2000)

})(); // IIFE
