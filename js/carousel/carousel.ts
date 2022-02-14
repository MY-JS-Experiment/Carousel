interface activeElement {
    index: number,
    last: boolean
}

interface positionInterface{
    left:number,
    top:number
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
        responsive:true
    }
    private el: HTMLElement
    private children: NodeListOf<HTMLElement>
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
    

    constructor(el: HTMLElement, params = {}) {
        this.settings = Object.assign({}, this.settings, params)
        this.el = el

        this.init()
    }

    init(): void {
        this.windowHeight = window.innerHeight
        this.windowWidth = window.innerWidth
        this.children = this.el.querySelectorAll(this.settings.elementSelector)
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
    }

    onResize(): void {
        if (!this.initialize || this.working) { return }
        let newHeight: number = window.innerHeight,
            newWidth: number = window.innerWidth
        if(newHeight != this.windowHeight || newWidth != this.windowWidth){
            this.windowHeight = newHeight
            this.windowWidth = newWidth
            this.children.forEach(e=>{
                e.style.width = this.getSlideWidth()
            })
            this.setSlidePosition()
        }
    }

    redraw():void{
        this.children = this.el.querySelectorAll(this.settings.elementSelector)
    }


    setSlidePosition():void{
        this.position = {
            left: this.children[this.active.index * this.getMoveBy()].getBoundingClientRect().x,
            top: this.children[this.active.index * this.getMoveBy()].getBoundingClientRect().y
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
}


window.addEventListener('load', function () {
    new Carousel(document.getElementById("test-carousel"))
})