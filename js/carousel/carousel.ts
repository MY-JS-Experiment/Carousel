interface activeElement {
    index: number,
    last: boolean
}

interface positionInterface{
    left:number,
    top:number
}

interface coordinate{
    x:number,
    y:number
}

class Carousel {

    private settings = {
        elementSelector: 'li',
        wraperName: 'cl-wrapper',
        minSlide: 1,
        maxSlide: 1,
        moveslide: 1,
        slideWidth: 0,
        startSlide: 0,
        startRandom: false,
        slideMode: 'horizontal',
        slideMargin: 0,
        infinitiLoop: true,
        responsive:true,
        touchEvent: true,
        swipeThreshold: 250
    }
    private el: HTMLElement
    private children: Array<HTMLElement> = []
    private viewport: HTMLElement
    private minThreshold: number
    private maxThreshold: number
    private active: activeElement
    private initialize: boolean = false
    private working: boolean = false
    private cssPrefix: string
    private position:positionInterface
    private windowWidth:number
    private windowHeight:number
    private touch:{
        start:coordinate,
        end:coordinate,
        originalPosition: positionInterface
    }
    private pointerId:number
    

    constructor(el: HTMLElement, params = {}) {
        this.settings = Object.assign({}, this.settings, params)
        this.el = el

        this.init()
    }

    init(): void {
        this.windowHeight = window.innerHeight
        this.windowWidth = window.innerWidth
        this.el.querySelectorAll(this.settings.elementSelector).forEach(e=>{
            this.children.push((e as HTMLAreaElement))
        })
        this.settings.minSlide = this.children.length < this.settings.minSlide ? this.children.length : this.settings.minSlide
        this.settings.maxSlide = this.children.length < this.settings.maxSlide ? this.children.length : this.settings.maxSlide

        if (this.settings.startRandom) { this.settings.startSlide = Math.floor(Math.random() * this.children.length) }
        this.active = {
            index: 0,
            last: false
        }
        let props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
        let div = document.createElement("div")
        props.forEach((e, i) => {
            if (typeof div.style[e] != 'undefined') {
                this.cssPrefix = props[i].replace('Perspective', '').toLowerCase()
            }
        })
        this.setup()
    }

    setup(): void {
        //insert viewport
        this.viewport = document.createElement("div")
        this.viewport.classList.add("cl-viewport")
        this.el.parentNode.insertBefore(this.viewport, this.el)
        Object.assign(this.viewport.style, {
            width: "100%",
            position: "relative",
            overflow: "hidden"
        })
        this.viewport.appendChild(this.el)

        //insert wrapper
        let wrapper: HTMLElement = document.createElement("div")
        wrapper.classList.add(this.settings.wraperName)
        this.viewport.parentNode.insertBefore(wrapper, this.viewport)
        wrapper.style.maxWidth = this.getViewportMaxWidth()
        wrapper.appendChild(this.viewport)

        this.el.style.width = (this.children.length * 1000 + 125) + '%'

        this.children.forEach(e => {
            e.style.width = this.getSlideWidth()
            e.style.float = "left"
            e.style.position = 'relative'
        })

        this.start()
    }

    start(): void {
        //crate clone
        if (this.settings.infinitiLoop) {
            let slice = this.settings.slideMode === "horizontal" ? this.settings.maxSlide : this.settings.minSlide
            let node: Node
            Array.from(this.children).slice(0, slice).forEach(e => {
                node = e.cloneNode(true);
                (node as HTMLElement).classList.add('cl-clone')
                this.el.appendChild(node)
            })
            Array.from(this.children).slice(-slice).forEach(e => {
                node = e.cloneNode(true);
                (node as HTMLElement).classList.add('cl-clone')
                this.el.insertBefore(node, this.children[0])
            })
        }
        this.setSlidePosition()
        this.redraw()
        this.initialize = true
        if(this.settings.responsive){window.addEventListener('resize', ()=>{this.onResize()})}
        if(this.settings.touchEvent){this.initTouch()}
    }

    onResize(): void {
        if (!this.initialize || this.working) { return }
        let newHeight: number = window.innerHeight,
            newWidth: number = window.innerWidth
        if(newHeight != this.windowHeight || newWidth != this.windowWidth){
            this.windowHeight = newHeight
            this.windowWidth = newWidth
            this.redraw()
        }
    }

    redraw():void{
        this.children.forEach(e=>{
            e.style.width = this.getSlideWidth()
        })
        this.el.querySelectorAll('.cl-clone').forEach(e=>{
            (e as HTMLElement).style.width = this.getSlideWidth()
        })
        this.setSlidePosition()
    }


    setSlidePosition():void{
        this.position = {
            left: this.children[this.active.index * this.getMoveBy()].offsetLeft,
            top: this.children[this.active.index * this.getMoveBy()].offsetTop
        }
        if(this.settings.slideMode === 'horizontal'){
            this.setSlideAnimationProperty(-this.position.left, 'reset', 0)
        }else if(this.settings.slideMode === 'vertical'){
            this.setSlideAnimationProperty(this.position.top, 'reset', 0)
        }
    }

    getMoveBy():number{
        if(this.settings.moveslide > 0 && this.settings.moveslide <= this.getNumberSlideShowing()){
            return this.settings.moveslide
        }  
        return this.getNumberSlideShowing()
    }

    initTouch():void{
        this.touch ={
            start:{x: 0, y:0},
            end:{x: 0, y:0},
            originalPosition:{left: 0, top: 0}
        }

        'touchstart MSPointerDown pointerdown'.split(' ').forEach(e=>{
            this.viewport.addEventListener(e, this.touchStart)
        })
    }

    touchStart = (e:Event)=>{
        if(e.type !== 'touchstart' && (e as PointerEvent).button !== 0)return
        e.preventDefault()
        
        if(e instanceof PointerEvent && (e as PointerEvent).pointerId === undefined)
            return
        let touchPoint:TouchList|Array<PointerEvent> = (e instanceof TouchEvent && typeof (e as TouchEvent).changedTouches !== 'undefined') ? (e as TouchEvent).changedTouches : [(e as PointerEvent)]
        this.touch.originalPosition = {left: this.el.getBoundingClientRect().x, top: this.el.getBoundingClientRect().y}   
        this.touch.start = {x: touchPoint[0].pageX, y: touchPoint[0].pageY}
        if(this.viewport.setPointerCapture && (e instanceof PointerEvent)){
            this.pointerId = (e as PointerEvent).pointerId
            this.viewport.setPointerCapture(this.pointerId)
        }
        
        'touchmove MSPointerMove pointermove'.split(' ').forEach(e=>{
            this.viewport.addEventListener(e, this.onTouchMove)
        })
        'touchend MSPointerUp pointerup'.split(' ').forEach(e=>{
            this.viewport.addEventListener(e, this.onTouchEnd)
        })
        'MSPointerCancel pointercancel'.split(' ').forEach(e=>{
            this.viewport.addEventListener(e, this.onPointerCancel)
        })
    }

    onPointerCancel = (e:Event)=>{
        e.preventDefault()
        'touchmove MSPointerMove pointermove'.split(' ').forEach(e=>{
            this.viewport.removeEventListener(e, this.onTouchMove)
        })
        'touchend MSPointerUp pointerup'.split(' ').forEach(e=>{
            this.viewport.removeEventListener(e, this.onTouchEnd)
        })
        'MSPointerCancel pointercancel'.split(' ').forEach(e=>{
            this.viewport.removeEventListener(e, this.onPointerCancel)
        })
        if(this.viewport.releasePointerCapture){
            this.viewport.releasePointerCapture(this.pointerId)
        }
    }

    onTouchEnd = (e:Event)=>{
        e.preventDefault()
        'touchmove MSPointerMove pointermove'.split(' ').forEach(e=>{
            this.viewport.removeEventListener(e, this.onTouchMove)
        })
        let touchPoint:TouchList|Array<PointerEvent> = (e instanceof TouchEvent && typeof (e as TouchEvent).changedTouches !== 'undefined') ? (e as TouchEvent).changedTouches : [(e as PointerEvent)]
        let distance:number = 0, oriPos = 0

        this.touch.end = {x: touchPoint[0].pageX, y: touchPoint[0].pageY}
        if(this.settings.slideMode === 'horizontal'){
            distance = this.touch.end.x - this.touch.start.x
            oriPos = this.touch.originalPosition.left
        }else if(this.settings.slideMode === 'vertical'){
            distance = this.touch.end.y - this.touch.start.y
            oriPos = this.touch.originalPosition.top
        }

        if(Math.abs(distance) >= this.settings.swipeThreshold){
            if (distance < 0)
                this.nextSlide()
            else
                this.prevSlide()
        }else{
            this.setSlideAnimationProperty(oriPos, 'reset', 200)
        }
        'touchend MSPointerUp pointerup'.split(' ').forEach(e=>{
            this.viewport.removeEventListener(e, this.onTouchEnd)
        })
        if(this.viewport.releasePointerCapture){
            this.viewport.releasePointerCapture(this.pointerId)
        }
    }

    onTouchMove = (e:Event)=>{
        let touchPoint:TouchList|Array<PointerEvent> = (e instanceof TouchEvent && typeof (e as TouchEvent).changedTouches !== 'undefined') ? (e as TouchEvent).changedTouches : [(e as PointerEvent)],
        value = 0,
        change = 0
        e.preventDefault()

        if(this.settings.slideMode === 'horizontal'){
            change = touchPoint[0].pageX - this.touch.start.x
            value = this.touch.originalPosition.left + change
        }else if(this.settings.slideMode === 'vertical'){
            change = touchPoint[0].pageY - this.touch.start.y
            value = this.touch.originalPosition.left + change
        }
        this.setSlideAnimationProperty(value, 'reset', 0)
    }

    getNumberSlideShowing():number{
        var slidesShowing = 1,
        childWidth = null;
        if(this.settings.slideMode === 'horizontal' && this.settings.slideWidth >0){
            if(this.viewport.offsetWidth < this.minThreshold){
                slidesShowing = this.settings.minSlide
            }else if(this.viewport.offsetWidth > this.maxThreshold){
                slidesShowing = this.settings.maxSlide
            }else
            {
                childWidth = this.children[0].offsetWidth + this.settings.slideMargin
                slidesShowing = (this.viewport.offsetWidth +this.settings.slideMargin) / childWidth 
            }
        }else if(this.settings.slideMode === 'vertical'){
            slidesShowing = this.settings.minSlide
        }
        return slidesShowing
    }

    getViewportMaxWidth(): string {
        let width: string = "100%"
        if (this.settings.slideWidth > 0) {
            if (this.settings.slideMode === "horizontal") {
                width = (this.settings.maxSlide * this.settings.slideWidth) + ((this.settings.maxSlide - 1) * this.settings.slideMargin) + "px"
            }
            else
                width = this.settings.slideWidth + "px"
        }
        return width
    }

    getSlideWidth(): string {
        let newWidth = this.settings.slideWidth
        let wrapwidth = this.viewport.offsetWidth
        if (this.settings.slideMode === 'vertical' || this.settings.slideWidth === 0 || this.settings.slideWidth > wrapwidth) {
            newWidth = wrapwidth
        }else{
            if (wrapwidth > this.maxThreshold) {
                return newWidth + "px"
            }else if(wrapwidth < this.minThreshold){
                newWidth = (wrapwidth - (this.settings.slideMargin * (this.settings.minSlide - 1)))/ this.settings.minSlide
            }
        }
        return newWidth + "px"
    }

    getPagerQty():number{
        let pagerQty:number = 0;
        if(this.settings.moveslide > 0){
            if(this.settings.infinitiLoop){
                pagerQty = Math.ceil(this.children.length / this.getMoveBy())
            }
        }else{
            pagerQty = Math.ceil(this.children.length / this.getNumberSlideShowing())
        }
        return pagerQty;
    }

    setSlideAnimationProperty(value: number, type: string, duration: number): void {
        let propValue = this.settings.slideMode === 'vertical' ? 'translate3d(0, ' + value + "px,0)" : 'translate3d(' + value + 'px,0,0)';
        this.el.style['-' + this.cssPrefix + '-transition-duration'] = duration / 1000 + 's'

        if(type === 'slide'){
            this.el.style['-'+this.cssPrefix+'-transform'] = propValue
            if(duration != 0){
                this.el.ontransitionend = (e:Event)=>{
                    if(e.target !== this.el){return}
                    this.el.ontransitionend = null
                }
            }
        }else if(type === 'reset'){
            this.el.style['-'+this.cssPrefix+'-transform'] = propValue
        }
    }

    setSlideIndex(slideIndex:number):number{
        if(slideIndex < 0){
            if(this.settings.infinitiLoop){
                return this.getPagerQty() - 1
            }else
                return this.active.index
        }else if(slideIndex >= this.getPagerQty()){
            if(this.settings.infinitiLoop){
                return 0
            }else{
                return this.active.index
            }
        }
        return slideIndex
    }

    nextSlide():void{
        let pageIndex  = this.active.index + 1
        this.goToSlide(pageIndex, "next")
    }

    prevSlide():void{
        let pageIndex  = this.active.index - 1
        this.goToSlide(pageIndex, "prev")
    }

    goToSlide(index:number, direction:string){
        let oldIndex = this.active.index
        this.active.index = this.setSlideIndex(index)
        let position:positionInterface = null
        this.working = true

        this.active.last = this.active.index === this.getPagerQty() - 1

        if(this.active.last && direction === 'prev'){
            console.log("this is last")
        }else if(this.active.index === 0 && direction === 'next'){
            console.log("this is first")
        }
        
        if(this.active.index >=0){
           let el =  this.children[this.active.index]
           position = {
               left: el.offsetLeft,
               top: el.offsetTop
           }
        }

        if(position !== null){
            if(this.settings.slideMode === 'horizontal'){
                this.setSlideAnimationProperty(-position.left, 'reset', 200)
            }else if(this.settings.slideMode === 'vertical'){
                this.setSlideAnimationProperty(-position.top, 'reset', 200)
            }
        }

        
    }
}


window.addEventListener('load', function () {
    new Carousel(document.getElementById("test-carousel"))
})