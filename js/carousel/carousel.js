var animateMode;
(function (animateMode) {
    animateMode["VERTICAL"] = "vertical";
    animateMode["HORIZONTAL"] = "horizontal";
})(animateMode || (animateMode = {}));
var animateDirection;
(function (animateDirection) {
    animateDirection[animateDirection["TOP"] = 0] = "TOP";
    animateDirection[animateDirection["LEFT"] = 1] = "LEFT";
})(animateDirection || (animateDirection = {}));
var Carousel = /** @class */ (function () {
    function Carousel(el, setting) {
        // private variable
        this._option = {
            speed: 500,
            shrinkItems: false,
            slideWidth: 0,
            minSlides: 1,
            maxSlides: 1,
            moveSlides: 0,
            slideSelector: 'li',
            randomStart: false,
            startSlide: 0,
            minThreshold: 0,
            maxThreshold: 0,
            slideMargin: 0,
            mode: animateMode.HORIZONTAL,
            ticker: false,
            wrapperClass: "cl-wrapper",
            infinityLoop: true,
            autoDirection: 'next',
            responsive: true,
            swipeThreshold: 50,
            onSliderLoad: function () { return true; },
            onSlideBefore: function () { return true; },
            onSlideAfter: function () { return true; },
            onSlideNext: function () { return true; },
            onSlidePrev: function () { return true; },
            onSliderResize: function () { return true; },
            onAutoChange: function () { return true; }
        };
        this.el = el;
        this._option = Object.assign({}, this._option, setting);
        this.init();
    }
    Carousel.prototype.init = function () {
        this._windowHeight = window.innerHeight;
        this._windowWidth = window.innerWidth;
        if (typeof this._option.slideWidth == "string")
            this._option.slideWidth = parseInt(this._option.slideWidth);
        this._children = this.el.querySelectorAll(this._option.slideSelector);
        if (this._children.length < this._option.minSlides) {
            this._option.minSlides = this._children.length;
        }
        if (this._children.length < this._option.maxSlides) {
            this._option.maxSlides = this._children.length;
        }
        if (this._option.randomStart) {
            this._option.startSlide = Math.floor(Math.random() * this._children.length);
        }
        this._active = { index: this._option.startSlide, last: false };
        this._carousel = this._option.minSlides > 1 || this._option.maxSlides > 1;
        this._option.minThreshold = (this._option.minSlides * this._option.slideWidth) + ((this._option.minSlides - 1) * this._option.slideMargin);
        this._option.maxThreshold = (this._option.maxSlides * this._option.slideWidth) + ((this._option.maxSlides - 1) * this._option.slideMargin);
        this._working = false;
        this._interval = null;
        var props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
        var div = document.createElement('div');
        for (var i = 0; i < props.length; i++) {
            if (div.style[props[i]] != undefined) {
                this.cssPrefix = props[i].replace('Perspective', '').toLocaleLowerCase();
                this._animProp = '-' + this.cssPrefix + '-transform';
                break;
            }
        }
        if (this._option.mode == animateMode.VERTICAL) {
            this._option.maxSlides = this._option.minSlides;
        }
        this.setup();
    };
    Carousel.prototype.setup = function () {
        var _this = this;
        this._viewport = document.createElement("div");
        this._viewport.classList.add('cl-viewport');
        this.el.parentElement.insertBefore(this._viewport, this.el);
        this._viewport.appendChild(this.el);
        this.el.style.width = this._option.mode === animateMode.HORIZONTAL ? (this._children.length * 1000 + 215) + '%' : 'auto';
        this.el.style.position = 'relative';
        this.el.style.left = "0";
        this._viewport.style.width = '100%';
        this._viewport.style.overflow = 'hidden';
        this._viewport.style.position = 'relative';
        this.lazyImage();
        var wrapper = document.createElement('div');
        wrapper.classList.add(this._option.wrapperClass);
        this._viewport.parentElement.insertBefore(wrapper, this._viewport);
        wrapper.appendChild(this._viewport);
        wrapper.style.maxWidth = this.getViewportSize();
        this._children.forEach(function (e) {
            e.style.float = _this._option.mode === animateMode.HORIZONTAL ? 'left' : 'none';
            e.style.listStyle = 'none';
            e.style.position = 'relative';
            e.style.width = _this.getSlideWidth();
        });
        this.start();
    };
    Carousel.prototype.getViewportSize = function () {
        var width = '100%';
        if (this._option.slideWidth > 0) {
            if (this._option.mode == animateMode.HORIZONTAL) {
                width = (this._option.maxSlides * this._option.slideWidth) + ((this._option.maxSlides - 1) * this._option.slideMargin);
                width += 'px';
            }
            else {
                width = this._option.slideWidth + 'px';
            }
        }
        return width;
    };
    Carousel.prototype.lazyImage = function () {
        this._children.forEach(function (e) {
            if (!e.querySelector("img[lazy]")) {
                var src = e.getAttribute('img-src');
                if (src) {
                    var img = document.createElement('img');
                    img.setAttribute('src', src);
                    img.setAttribute('lazy', 'true');
                    img.style.width = '100%';
                    e.appendChild(img);
                }
            }
        });
    };
    Carousel.prototype.getSlideWidth = function () {
        var elWidth = this._option.slideWidth, wrapWidth = this._viewport.clientWidth;
        if (this._option.slideWidth === 0 || this._option.slideWidth > wrapWidth || this._option.mode === animateMode.VERTICAL) {
            elWidth = wrapWidth;
        }
        else if (this._option.maxSlides > 1 && this._option.mode === animateMode.HORIZONTAL) {
            if (wrapWidth > this._option.maxThreshold) {
                return elWidth + 'px';
            }
            else if (wrapWidth < this._option.minThreshold) {
                elWidth = (wrapWidth - (this._option.slideMargin * (this._option.minSlides - 1))) / this._option.minSlides;
            }
            else if (this._option.shrinkItems) {
                elWidth = Math.floor((wrapWidth + this._option.slideMargin) / (Math.ceil((wrapWidth + this._option.slideMargin) / (elWidth + this._option.slideMargin))) - this._option.slideMargin);
            }
        }
        return elWidth + 'px';
    };
    Carousel.prototype.getNumberSlideShowing = function () {
        var slideShowing = 1, childWidth = null;
        if (this._option.mode === animateMode.HORIZONTAL && this._option.slideWidth > 0) {
            if (this._viewport.clientWidth < this._option.minThreshold) {
                slideShowing = this._option.minSlides;
            }
            else if (this._viewport.offsetWidth > this._option.maxThreshold) {
                slideShowing = this._option.maxSlides;
            }
            else {
                childWidth = this._children[0].clientWidth + this._option.slideMargin;
                slideShowing = Math.floor((this._viewport.clientWidth + this._option.slideMargin) / childWidth) | 1;
            }
        }
        else if (this._option.mode === animateMode.VERTICAL) {
            slideShowing = this._option.maxSlides;
        }
        return slideShowing;
    };
    Carousel.prototype.getPagerQty = function () {
        var pagerQty = 0, breakPoint = 0, counter = 0;
        // if moveslides is specified by a user
        if (this._option.moveSlides > 0) {
            if (this._option.infinityLoop) {
                pagerQty = Math.ceil(this._children.length / this.getMoveBy());
            }
            else {
                // when breakPoint goes above children length, counter is the number of pages
                while (breakPoint < this._children.length) {
                    ++pagerQty;
                    breakPoint = counter + this.getNumberSlideShowing();
                    counter += (this._option.moveSlides <= this.getNumberSlideShowing() ? this._option.moveSlides : this.getNumberSlideShowing());
                }
                return counter;
            }
        } // if moveSlides is 0 (auto) devide children length by sides showing and round up
        else {
            pagerQty = Math.ceil(this._children.length / this.getNumberSlideShowing());
        }
        return pagerQty;
    };
    Carousel.prototype.getMoveBy = function () {
        //if moveSlides was set by the user and moveSlides is less then number of slide showing
        if (this._option.moveSlides > 0 && this._option.moveSlides <= this.getNumberSlideShowing()) {
            return this._option.moveSlides;
        }
        // if moveSlides is 0 (auto)
        return this.getNumberSlideShowing();
    };
    Carousel.prototype.setSlidePosition = function () {
        var position, lastChild, lastShowingIndex;
        //if last slide, not infinite loop, and number of childen is larger than max slides
        if (this._children.length > this._option.maxSlides &&
            this._active.last && !this._option.infinityLoop) {
            if (this._option.mode === animateMode.HORIZONTAL) {
                lastChild = this._children[this._children.length - 1];
                position = {
                    top: lastChild.offsetTop,
                    left: lastChild.offsetLeft
                };
                this.setPositionProperty(-(position.left - this._viewport.clientWidth, lastChild.clientWidth), 'reset', 0);
            }
            else if (this._option.mode === animateMode.VERTICAL) {
                lastShowingIndex = this._children.length - this._option.minSlides;
                position = {
                    left: this._children[lastShowingIndex].offsetLeft,
                    top: this._children[lastShowingIndex].offsetTop
                };
                this.setPositionProperty(-position.top, 'reset', 0);
            }
        }
        else {
            position = {
                left: this._children[this._active.index * this.getMoveBy()].offsetLeft,
                top: this._children[this._active.index * this.getMoveBy()].offsetTop
            };
            if (this._active.index === this.getPagerQty() - 1) {
                this._active.last = true;
            }
            if (position.left != undefined && position.top != undefined) {
                this.setPositionProperty(-position.left, 'reset', 0);
            }
            else
                this.setPositionProperty(-position.top, 'reset', 0);
        }
    };
    Carousel.prototype.updateAfterSlideTransition = function () {
        console.log("update after slide");
        if (this._option.infinityLoop) {
            var position = null;
            // first slide
            if (this._active.index == 0) {
                position = {
                    left: this._children[0].offsetLeft,
                    top: this._children[0].offsetTop
                };
            }
            else if (this._active.index === this.getPagerQty() - 1 && this._carousel) {
                position = {
                    left: this._children[this.getPagerQty() - 1].offsetLeft,
                    top: this._children[this.getPagerQty() - 1].offsetTop
                };
            }
            else if (this._active.index === this._children.length - 1) {
                position = {
                    left: this._children[this._children.length - 1].offsetLeft,
                    top: this._children[this._children.length - 1].offsetTop
                };
            }
            if (position) {
                if (this._option.mode === animateMode.HORIZONTAL) {
                    this.setPositionProperty(position.left, 'reset', 0);
                }
                else if (this._option.mode === animateMode.VERTICAL) {
                    this.setPositionProperty(-position.top, 'reset', 0);
                }
            }
            this._working = false;
            this._option.onSlideAfter.call(this.el, this._children[this._active.index], this._oldIndex, this._active.index);
        }
    };
    Carousel.prototype.setPositionProperty = function (value, type, duration, params) {
        var _this = this;
        if (params === void 0) { params = null; }
        var animateObj, propValue;
        propValue = this._option.mode === animateMode.VERTICAL ? 'translate3d(0, ' + value + 'px, 0)' : 'translate3d(' + value + 'px, 0, 0)';
        this.el.style.transitionDuration = duration / 1000 + "s";
        if (type === 'slide') {
            this.el.style.transform = propValue;
            if (duration != 0) {
                this.el.ontransitionend = function (e) {
                    if (e.target !== _this.el) {
                        return;
                    }
                    _this.el.onanimationend = null;
                    _this.updateAfterSlideTransition();
                };
            }
            else {
                this.updateAfterSlideTransition();
            }
        }
        else if (type === 'reset') {
            this.el.style.transform = propValue;
        }
        else if (type === 'ticker') {
            this.el.style.transitionTimingFunction = 'linear';
            this.el.style.transform = propValue;
            if (duration != 0) {
                this.el.ontransitionend = function (e) {
                    if (e.target !== _this.el) {
                        return;
                    }
                    _this.el.ontransitionend = null;
                    _this.setPositionProperty(params.resetParamValue, 'reset', 0);
                    _this.tickerLoop();
                };
            }
        }
    };
    Carousel.prototype.start = function () {
        var _this = this;
        if (this._option.infinityLoop && !this._option.ticker) {
            var slice = this._option.mode === animateMode.VERTICAL ? this._option.minSlides : this._option.maxSlides, sliceAppend = [], slicePrepend = [];
            Array.from(this._children).slice(0, slice).forEach(function (e) {
                sliceAppend.push(e.cloneNode(true));
                sliceAppend[sliceAppend.length - 1].classList.add('cl-clone');
                _this._children[0].parentNode.insertBefore(sliceAppend[sliceAppend.length - 1], _this._children[0]);
            });
            Array.from(this._children).slice(-slice).forEach(function (e) {
                slicePrepend.push(e.cloneNode(true));
                slicePrepend[slicePrepend.length - 1].classList.add('cl-clone');
                _this.el.appendChild(slicePrepend[slicePrepend.length - 1]);
            });
            this.setSlidePosition();
        }
        this.redrawSlider();
        this._initialize = true;
        if (this._option.responsive) {
            this.onResize();
        }
        if (this._option.ticker) {
            this.initTicker();
        }
        this.initTouch();
    };
    Carousel.prototype.onResize = function () {
        var _this = this;
        window.addEventListener('resize', function () {
            _this.resizeWindow();
        });
    };
    Carousel.prototype.resizeWindow = function () {
        if (!this._initialize) {
            return;
        }
        if (this._working) {
            window.setTimeout(this.resizeWindow, 10);
        }
        else {
            var windowWidthNew = window.innerWidth, windowHeightNew = window.innerHeight;
            if (this._windowWidth !== windowWidthNew ||
                this._windowHeight !== windowHeightNew) {
                this._windowWidth = windowWidthNew;
                this._windowHeight = windowHeightNew;
                this.redrawSlider();
            }
            this._option.onSliderResize.call(this.el, this._active.index);
        }
    };
    Carousel.prototype.initTicker = function () {
        var _this = this;
        var starPosition = 0, position, transform, value, idx, ratio, property, newSpeed, totalDimens;
        if (this._option.autoDirection === 'next') {
            var el_1;
            this._children.forEach(function (e) {
                el_1.push(e.cloneNode(true));
                el_1[el_1.length - 1].classList.add('cl-clone');
            });
            el_1.forEach(function (e) {
                _this.el.appendChild(e);
            });
        }
        else { //if autodirection is "prev", prepend a clone of the entire slider, and set to left
            var el_2;
            this._children.forEach(function (e) {
                el_2.push(e.cloneNode(true));
                el_2[el_2.length - 1].classList.add('cl-clone');
            });
            el_2.forEach(function (e) {
                _this.el.insertBefore(e, _this._children[0]);
                position = {
                    left: _this._children[0].offsetLeft,
                    top: _this._children[0].offsetTop
                };
                starPosition = _this._option.mode === animateMode.HORIZONTAL ? -position.left : -position.top;
            });
            this.setPositionProperty(starPosition, "reset", 0);
        }
    };
    Carousel.prototype.tickerLoop = function (resumeSpeed) {
        if (resumeSpeed === void 0) { resumeSpeed = null; }
        var speed = resumeSpeed ? resumeSpeed : this._option.speed, position = { left: 0, top: 0 }, reset = { left: 0, top: 0 }, animateProperty, resetValue, params;
        if (this._option.autoDirection === 'next') {
            position = {
                left: this.el.querySelector('.cl-clone').offsetTop,
                top: this.el.querySelector('.cl-clone').offsetLeft
            };
        }
        else {
            reset = {
                left: this._children[0].offsetLeft,
                top: this._children[0].offsetTop
            };
        }
        animateProperty = this._option.mode === animateMode.HORIZONTAL ? -position.left : -position.top;
        resetValue = this._option.mode === animateMode.HORIZONTAL ? -reset.left : -reset.top;
        params = {
            resetParamValue: resetValue
        };
        this.setPositionProperty(animateProperty, 'ticker', speed, params);
    };
    Carousel.prototype.redrawSlider = function () {
        var _this = this;
        this._children = this.el.querySelectorAll(this._option.slideSelector);
        this._children.forEach(function (e) {
            e.style.width = _this.getSlideWidth();
        });
        if (this._option.ticker) {
            this.setSlidePosition();
        }
    };
    Carousel.prototype.initTouch = function () {
        var _this = this;
        this._touch = {
            end: { x: 0, y: 0 },
            start: { x: 0, y: 0 },
            originalPosition: { left: 0, top: 0 }
        };
        console.log("initTouch");
        "touchstart MSPointerDown pointerdown".split(" ").forEach(function (e) {
            _this._viewport.addEventListener(e, function (ev) {
                _this.onTouchStart(ev);
            });
        });
    };
    Carousel.prototype.onTouchStart = function (e) {
        var _this = this;
        if (this._working) {
            e.preventDefault();
        }
        else {
            this._touch.originalPosition = {
                left: this.el.offsetLeft,
                top: this.el.offsetTop
            };
            var orig = e;
            var touchPoin = (typeof orig.targetTouches != 'undefined') ? orig.changedTouches : orig.targetTouches;
            if (this.el.setPointerCapture && e instanceof PointerEvent) {
                this._pointerId = e.pointerId;
                this.el.setPointerCapture(this._pointerId);
            }
            if (typeof touchPoin == 'undefined')
                return;
            this._touch.start.x = touchPoin[0].pageX;
            this._touch.start.y = touchPoin[0].pageY;
            "touchmove MSPointerMove pointerMove".split(" ").forEach(function (e) {
                _this._viewport.addEventListener(e, function (ev) {
                    _this.onTouchMove(ev);
                });
            });
            'touchend MSPointerUp pointerup'.split(" ").forEach(function (e) {
                _this._viewport.addEventListener(e, function (ev) {
                    _this.onTouchEnd(ev);
                });
            });
            'MSPointerCancel pointercancel'.split(" ").forEach(function (e) {
                _this._viewport.addEventListener(e, function (ev) {
                    _this.onPointerCancel(ev);
                });
            });
        }
    };
    Carousel.prototype.onPointerCancel = function (e) {
        var _this = this;
        console.log("onPointerCancel");
        // fire after touchstart, move element to left 0
        this.setPositionProperty(this._touch.originalPosition.left, 'reset', 0);
        'MSPointerCancel pointercancel'.split(" ").forEach(function (e) {
            _this._viewport.removeEventListener(e, function (ev) {
                _this.onPointerCancel(ev);
            });
        });
        "touchmove MSPointerMove pointerMove".split(" ").forEach(function (e) {
            _this._viewport.removeEventListener(e, function (ev) {
                _this.onTouchMove(ev);
            });
        });
        'touchend MSPointerUp pointerup'.split(" ").forEach(function (e) {
            _this._viewport.removeEventListener(e, function (ev) {
                _this.onTouchEnd(ev);
            });
        });
        if (this.el.releasePointerCapture) {
            this.el.releasePointerCapture(this._pointerId);
        }
    };
    Carousel.prototype.onTouchMove = function (e) {
        console.log("onTouchMove");
        var orig = e;
        var touchPoin = (typeof orig.changedTouches != 'undefined') ? orig.changedTouches : orig.targetTouches;
        var xMovement = Math.abs(touchPoin[0].pageX - this._touch.start.x);
        var yMovement = Math.abs(touchPoin[0].pageY - this._touch.start.y);
        var value = 0, change = 0;
        if ((xMovement * 3) > yMovement) {
            e.preventDefault();
        }
        if (this._option.mode === animateMode.HORIZONTAL) { //drag along x axis
            change = touchPoin[0].pageX - this._touch.start.x;
            value = this._touch.originalPosition.left + change;
        }
        else { //drag along y axis
            change = touchPoin[0].pageY - this._touch.start.y;
            value = this._touch.originalPosition.top + change;
        }
        this.setPositionProperty(value, 'reset', 0);
    };
    Carousel.prototype.onTouchEnd = function (e) {
        var _this = this;
        console.log("onTouchEnd");
        'touchmove MSPointerMove pointermove'.split(' ').forEach(function (e) {
            _this._viewport.removeEventListener(e, function (ev) {
                _this.onTouchMove(ev);
            });
        });
        var orig = e, touchPoin = (typeof orig.changedTouches !== 'undefined') ? orig.changedTouches : orig.targetTouches, value = 0, distance = 0;
        if (typeof touchPoin === 'undefined')
            return;
        this._touch.end.x = touchPoin[0].pageX;
        this._touch.end.y = touchPoin[0].pageY;
        if (this._option.mode === animateMode.HORIZONTAL) {
            distance = this._touch.end.x - this._touch.start.x;
            value = this._touch.originalPosition.left;
        }
        else {
            distance = this._touch.end.y - this._touch.start.y;
            value = this._touch.originalPosition.top;
        }
        //if not infinity loop and first / last slide, do not attempt slide transition
        if (!this._option.infinityLoop && ((this._active.index === 0 && distance > 0) || (this._active.last && distance < 0))) {
            this.setPositionProperty(value, 'reset', 200);
        }
        else {
            if (Math.abs(distance) >= this._option.swipeThreshold) {
                if (this._touch.start.x > this._touch.end.x) {
                    console.log("go to next slide");
                    this.goToNextSlide();
                }
                else {
                    console.log("go to prev slide");
                    this.goToPrevSlide();
                }
                console.log("stopAuto");
            }
            else {
                this.setPositionProperty(value, "reset", 200);
            }
        }
    };
    Carousel.prototype.setSlideIndex = function (slideIndex) {
        if (slideIndex < 0) {
            if (this._option.infinityLoop) {
                return this.getPagerQty() - 1;
            }
            else {
                return this._active.index;
            }
        }
        else if (slideIndex >= this.getPagerQty()) {
            if (this._option.infinityLoop) {
                return 0;
            }
            else {
                return this._active.index;
            }
        }
        return slideIndex;
    };
    Carousel.prototype.goToSlide = function (slideIndex, direction) {
        var performTransition = true, moveBy = 0, position = {
            left: 0,
            top: 0
        }, lastChild = null, lastShowingIndex, eq, value, requestEl;
        this._oldIndex = this._active.index;
        this._active.index = this.setSlideIndex(slideIndex);
        if (this._working || this._active.index === this._oldIndex)
            return;
        this._working = true;
        performTransition = this._option.onSlideBefore.call(this.el, this._children[this._active.index], this._oldIndex);
        // if transition canceled, reset and return
        if (typeof performTransition !== 'undefined' && !performTransition) {
            this._active.index = this._oldIndex;
            this._working = false;
            return;
        }
        if (direction === 'next') {
            if (!this._option.onSlideNext.call(this.el, this._children[this._active.index], this._oldIndex, this._active.index)) {
                performTransition = false;
            }
        }
        else if (direction === 'prev') {
            if (!this._option.onSlidePrev.call(this.el, this._children[this._active.index], this._oldIndex, this._active.index)) {
                performTransition = false;
            }
        }
        //check if last slide
        this._active.last = this._active.index >= this.getPagerQty() - 1;
        //slider mode is not 'fade'
        // if carousel not infinite loop
        if (!this._option.infinityLoop && this._active.last) {
            if (this._option.mode === animateMode.HORIZONTAL) {
                // get last child position
                lastChild = this._children[this._children.length - 1];
                position = {
                    left: lastChild.offsetLeft,
                    top: lastChild.offsetTop
                };
                moveBy = this._viewport.clientWidth - lastChild.offsetWidth;
            }
            else {
                lastShowingIndex = this._children.length - this._option.minSlides;
                position = {
                    left: this._children[lastShowingIndex].offsetLeft,
                    top: this._children[lastShowingIndex].offsetTop
                };
            }
        }
        else if (direction === 'prev' && this._active.last) {
            // get last child position
            eq = this._option.moveSlides == 1 ? this._option.maxSlides - this.getMoveBy() : this._option.maxSlides;
            lastChild = this.el.querySelectorAll('.cl-clone')[eq];
            position = {
                left: lastChild.offsetLeft,
                top: lastChild.offsetTop
            };
        }
        else if (direction === 'next' && this._active.index === 0) {
            console.log("init slide = 0");
            var el = this.el.querySelectorAll('> .cl-clone')[this._option.maxSlides];
            position = {
                left: el.offsetLeft,
                top: el.offsetTop
            };
            this._active.last = false;
        }
        else if (slideIndex >= 0) {
            console.log("slide index >= 0");
            requestEl = slideIndex * this.getMoveBy();
            var el = this._children[requestEl];
            position = {
                left: el.offsetLeft,
                top: el.offsetTop
            };
        }
        // if the position doesn't exist
        if (typeof position !== 'undefined') {
            value = this._option.mode === animateMode.HORIZONTAL ? -(position.left - moveBy) : -position.top;
            this.setPositionProperty(value, 'slide', this._option.speed);
        }
        else
            this._working = false;
    };
    Carousel.prototype.goToNextSlide = function () {
        var pagerIndex = this._active.index + 1;
        this.goToSlide(pagerIndex, 'next');
    };
    Carousel.prototype.goToPrevSlide = function () {
        var pagerIndex = this._active.index + 1;
        this.goToSlide(pagerIndex, 'prev');
    };
    return Carousel;
}());
new Carousel(document.getElementById("test-carousel"), {
// slideWidth: 600
});
//# sourceMappingURL=carousel.js.map