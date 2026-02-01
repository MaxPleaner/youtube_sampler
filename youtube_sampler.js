// ==UserScript==
// @name         Youtube Sampler
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Record clips from YouTube videos
// @author       You
// @match        https://www.youtube.com/watch*
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// ==/UserScript==

// Thanks to https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element
// Updated to use vanilla JS (YouTube's Trusted Types CSP blocks jQuery loading and innerHTML)

(function() {
    var video, startTime, endTime;
    var slideContainer, slider1, slider2, boundsText, downloadResultBtn, showBtn;

    function initVideo() {
        video = document.querySelector("video");
        if (!video) return false;
        startTime = 0;
        endTime = video.duration;
        return true;
    }

    function loopVideo() {
        video.ontimeupdate = () => {
            if (video.currentTime > endTime) video.currentTime = startTime;
            if (video.currentTime < startTime) video.currentTime = startTime;
        };
    }

    function displayTime(floatSeconds) {
        var minutes = parseInt(floatSeconds / 60);
        var seconds = parseInt(floatSeconds - (minutes * 60));
        return minutes + ":" + seconds.toString().padStart(2, '0');
    }

    function createStyledElement(tag, styles, text) {
        var el = document.createElement(tag);
        Object.assign(el.style, styles);
        if (text) el.textContent = text;
        return el;
    }

    function addUIElements() {
        // Show button (visible when container is hidden)
        showBtn = createStyledElement('button', {
            position: 'fixed', bottom: '10px', right: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)', color: 'lightblue',
            border: '1px solid lightblue', borderRadius: '4px',
            padding: '8px 12px', cursor: 'pointer', zIndex: '999999',
            display: 'none'
        }, 'Sampler');
        document.body.appendChild(showBtn);

        slideContainer = createStyledElement('div', {
            position: 'fixed', bottom: '0', padding: '15px',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: '999999',
            width: '100%', left: '0'
        });
        slideContainer.className = 'yt-sampler-container';

        // Hide button
        var hideBtn = createStyledElement('a', {
            color: 'lightblue', textDecoration: 'underline',
            cursor: 'pointer', marginRight: '10px'
        }, 'hide');
        hideBtn.href = '#';
        hideBtn.addEventListener('click', function(e) {
            e.preventDefault();
            slideContainer.style.display = 'none';
            showBtn.style.display = 'block';
        });
        slideContainer.appendChild(hideBtn);

        // Show button click handler
        showBtn.addEventListener('click', function() {
            slideContainer.style.display = 'block';
            showBtn.style.display = 'none';
        });

        var recordBtn = createStyledElement('a', {
            color: 'lightblue', textDecoration: 'underline',
            cursor: 'pointer', marginRight: '10px'
        }, 'record');
        recordBtn.id = 'client-download-btn';
        recordBtn.href = '#';
        slideContainer.appendChild(recordBtn);

        downloadResultBtn = createStyledElement('a', {
            color: 'lightblue', textDecoration: 'underline',
            cursor: 'pointer', display: 'none'
        }, 'result');
        downloadResultBtn.id = 'client-download-result-btn';
        slideContainer.appendChild(downloadResultBtn);
        slideContainer.appendChild(document.createElement('br'));

        boundsText = createStyledElement('p', { color: 'white', margin: '5px 0' },
            displayTime(startTime) + ' - ' + displayTime(endTime));
        slideContainer.appendChild(boundsText);

        // Slider 1
        var s1Div = document.createElement('div');
        s1Div.appendChild(createStyledElement('label', { color: 'white', width: '50px', display: 'inline-block' }, 'Start: '));
        slider1 = document.createElement('input');
        Object.assign(slider1, { type: 'range', step: '0.1', min: '0', max: String(video.duration), value: '0' });
        slider1.style.width = '80%';
        s1Div.appendChild(slider1);
        slideContainer.appendChild(s1Div);

        // Slider 2
        var s2Div = document.createElement('div');
        s2Div.appendChild(createStyledElement('label', { color: 'white', width: '50px', display: 'inline-block' }, 'End: '));
        slider2 = document.createElement('input');
        Object.assign(slider2, { type: 'range', step: '0.1', min: '0', max: String(video.duration), value: String(video.duration) });
        slider2.style.width = '80%';
        s2Div.appendChild(slider2);
        slideContainer.appendChild(s2Div);

        document.body.appendChild(slideContainer);
    }

    function addUIEventHandlers() {
        slider1.addEventListener('input', function() {
            startTime = Math.min(parseFloat(slider1.value), endTime - 0.1);
            slider1.value = startTime;
            video.currentTime = startTime;
            boundsText.textContent = displayTime(startTime) + ' - ' + displayTime(endTime);
        });
        slider2.addEventListener('input', function() {
            endTime = Math.max(parseFloat(slider2.value), startTime + 0.1);
            slider2.value = endTime;
            boundsText.textContent = displayTime(startTime) + ' - ' + displayTime(endTime);
        });
    }

    function addPageChangeListener() {
        var currentPage = window.location.href;
        setInterval(() => {
            if (currentPage != window.location.href) {
                currentPage = window.location.href;
                setTimeout(() => {
                    if (initVideo()) {
                        slider1.max = String(video.duration);
                        slider1.value = '0';
                        slider2.max = String(video.duration);
                        slider2.value = String(video.duration);
                        startTime = 0;
                        endTime = video.duration;
                        boundsText.textContent = displayTime(startTime) + ' - ' + displayTime(endTime);
                        downloadResultBtn.style.display = 'none';
                    }
                }, 2000);
            }
        }, 2000);
    }

    function addDownloadButtonListener(mediaType) {
        document.getElementById('client-download-btn').addEventListener('click', function(e) {
            e.preventDefault();
            video.currentTime = startTime;
            video.play();

            var recorder = new MediaRecorder(video.captureStream(), { mimeType: mediaType });
            var data = [];
            recorder.ondataavailable = (ev) => data.push(ev.data);
            recorder.start();
            console.log("Recording for " + (endTime - startTime) + " seconds...");

            setTimeout(function() {
                recorder.stop();
                recorder.onstop = function() {
                    video.pause();
                    console.log("Recording done");
                    var blob = new Blob(data, { type: mediaType });
                    downloadResultBtn.href = URL.createObjectURL(blob);
                    downloadResultBtn.download = (prompt("title?") || "clip") + ".webm";
                    downloadResultBtn.style.display = "inline";
                    downloadResultBtn.click();
                };
            }, (endTime - startTime) * 1000);
        });
    }

    setTimeout(function() {
        if (initVideo()) {
            loopVideo();
            addUIElements();
            addUIEventHandlers();
            addPageChangeListener();
            addDownloadButtonListener("video/webm");
            console.log("Youtube Sampler initialized");
        }
    }, 2000);
})();
