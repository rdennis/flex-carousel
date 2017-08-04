(function (w, d) {
    const DIRECTION = {
        FORWARD: 'forward',
        REVERSE: 'reverse'
    };


    const _datasetReplacer = /-(\w)?/g;

    const _registry = {};

    let _idSeed = 0;

    let _defaults = {
        FlexCarousel: {
            initialIndex: 0,
            autoPlay: true,
            direction: DIRECTION.FORWARD,
            speed: 5000
        },
        FlexCarouselIndicator: {
            activeClass: ''
        }
    };

    function _tryParseNumber(value) {
        // convert to number if value is a number, or string containing a valid numberic representation
        // filter out null, '', and  '    '
        // note: isNaN(<null || ''>) return false, so we catch them with !value first
        // note: isNaN('   ') returns false, so we catch it with !trim(value)
        return (!value || !String.prototype.trim.call(value) || isNaN(value)) ? value : +value;
    }

    function _getRegistrySet(name) {
        return _registry[name] || new Set();
    }

    function _addRegistryValue(name, carousel) {
        (_registry[name] = (_registry[name] || new Set())).add(carousel);
    }

    function _attributeToDatasetName(attribute) {
        return attribute.replace(_datasetReplacer, (match, letter) => letter.toUpperCase());
    }

    function _getElementData(el, attribute) {
        let datasetName = _attributeToDatasetName(attribute);
        return el && (el.dataset[datasetName] || el.getAttribute(attribute) || '');
    }

    function _getItemElementData(el) {
        let data = _getElementData(el, 'flex-carousel-item') || "";
        let pairs = data.split(';');

        return pairs.reduce((obj, pair) => {
            let [k, v] = pair.split(':');

            k = k.trim();

            v = _tryParseNumber(v);

            obj[k] = v;

            return obj;
        }, {});
    }

    function _getElementId(el) {
        let id = el.getAttribute('id');

        if (!id) {
            id = `flex-carousel-${++_idSeed}`;
            el.setAttribute('id', id);
        }

        return id;
    }

    function _getNextIndex(carousel, direction) {
        let index = 0;

        if (typeof direction === 'string') {
            if (direction === '+1' || direction === DIRECTION.FORWARD) {
                index = carousel.currentIndex + 1;
            } else if (direction === '-1' || direction === DIRECTION.REVERSE) {
                index = carousel.currentIndex - 1;
            } else {
                index = parseInt(direction, 10) || 0;
            }
        } else if (typeof direction === 'number') {
            index = direction;
        }

        // if < 0, wrap to end, if > itemCount -1, wrap to beginning
        index = index < 0 ? carousel.itemCount - 1 : index;
        index = index > carousel.itemCount - 1 ? 0 : index;
        return index;
    }

    function _setAriaVisibility(items, currentIndex) {
        if (items && items.length > 0) {
            for (let i = 0, l = items.length; i < l; i++) {
                let item = items.item(i);
                item.setAttribute('aria-hidden', i === currentIndex);
            }
        }
    }

    function _setAriaControls(control, targets) {
        let ariaControls;

        // make sure we have a target, element, and no element[aria-controls] value
        if (control && targets && targets.size && control.el && !(ariaControls = control.el.getAttribute('aria-controls'))) {
            ariaControls = '';

            targets.forEach((target) => {
                if (target && target.el) {
                    let id = target.el.getAttribute('id');
                    ariaControls += ` ${id}`;
                }
            });

            control.el.setAttribute('aria-controls', ariaControls.trim());
        }
    }


    /**
     * Class responsible for carousel functionality.
     */
    class FlexCarousel {
        /**
         * Creates a FlexCarousel.
         * @param {Element} el - The Element to use as a carousel.
         * @param {Object} config - Configuration for the carousel.
         * @param {string} config.direction - The initial direction of the carousel's slide.
         * @param {number} config.speed - The default speed of the carousel's slide in ms. 
         */
        constructor(el, config) {
            if (!el) {
                throw 'FlexCarousel needs an Element!';
            }

            this.settings = Object.assign({}, FlexCarousel.defaults, config);

            this.el = el;
            this.id = _getElementId(this.el);
            this.name = _getElementData(el, 'flex-carousel').split(':')[0];
            this.currentIndex = this.settings.initialIndex;

            this.items = this.el.children;
            this.itemCount = this.items.length;

            // todo: support vertical orientation?
            let parentStyle = window.getComputedStyle(this.el.parentElement);
            let elStyle = window.getComputedStyle(this.el);

            // require overflow-x: hidden
            if (parentStyle.overflowX !== 'hidden') {
                this.el.parentElement.style.overflowX = 'hidden';
            }

            // require el to be positioned (don't care how)
            if (elStyle.position === 'static') {
                el.style.position = 'relative';
            }

            // require el to be a flexbox
            if (!elStyle.display.includes('flex')) {
                el.style.display = 'flex';
            }

            // el width is based on number of items
            this.el.style.width = `${this.items.length * 100}%`;

            // each item must have flex: 1 0 auto
            for (let i = 0, l = this.itemCount; i < l; i++) {
                let item = this.items.item(i);
                item.style.flex = '1 0 auto';
            }

            _addRegistryValue(this.name, this);

            // listen for events
            ['slide', 'play', 'pause', 'toggle'].forEach((event) => {
                this.el.addEventListener(`fc:${event}`, (e) => this[event](e.detail));
            });

            // slide to the initial item
            this.slide(this.currentIndex);

            // start the carousel
            if (this.settings.autoPlay) {
                this.play();
            }
        }

        /**
         * Moves the carousel to the given position.
         * @param {(number|string)} direction - The zero based index of the target item, or the strings `'forward'` (or `'+1'`), or `'backward'` (or `'-1'`).
         */
        slide(direction) {
            this.currentIndex = _getNextIndex(this, direction);
            // left % is relative to the containing block
            let position = this.currentIndex * 100;
            this.el.style.left = `-${position}%`;
            _setAriaVisibility(this.items, this.currentIndex);

            // trigger slid event
            this.el.dispatchEvent(new CustomEvent('fc:slid', { detail: this.currentIndex }));
        }

        /**
         * Starts automatically moving the carousel.
         */
        play() {
            let currentItem = this.items.item(this.currentIndex);
            let settings = Object.assign({}, this.settings, _getItemElementData(currentItem));

            this._timeout = w.setTimeout(() => {
                this.slide(this.settings.direction);
                this.play();
            }, settings.speed);
        }

        /**
         * Stops automatically moving the carousel.
         */
        pause() {
            w.clearTimeout(this._timeout);
            this._timeout = null;
        }

        /**
         * Toggles the play state of the carousel.
         */
        toggle() {
            if (this._timeout) {
                this.pause();
            } else {
                this.play();
            }
        }

        /**
         * Gets the global default settings for carousels.
         * @static
         */
        static get defaults() {
            return _defaults.FlexCarousel;
        }

        /**
         * Sets the global default settings for carousels.
         * @static
         * @param {Object} defaults - The default global options.
         */
        static set defaults(defaults) {
            _defaults.FlexCarousel = defaults;
        }
    }


    /**
     * Class responsible for carousel control functionality.
     */
    class FlexCarouselControl {
        /**
         * Creates a FlexCarouselControl.
         * @param {Element} el - The Element to use as a carousel control. 
         */
        constructor(el) {
            if (!el) throw 'FlexCarouselControl needs an Element!';
            this.el = el;

            // get data from format "<targetName>:<event>:<param>"
            [this.targetName, this.event, this.param] = _getElementData(el, 'flex-carousel-control').split(':');

            _setAriaControls(this, _getRegistrySet(this.targetName));
            this.el.addEventListener('click', () => this.onclick());
        }

        /**
         * The handler called when the control is clicked.
         */
        onclick() {
            let targets = _getRegistrySet(this.targetName);

            targets.forEach((target) => {
                if (target && target.el) {
                    target.el.dispatchEvent(new CustomEvent(`fc:${this.event}`, { detail: this.param }));
                }
            });
        }
    }

    class FlexCarouselIndicator {
        constructor(el, config) {
            if (!el) throw 'FlexCarouselIndicator needs an Element!';
            this.el = el;

            this.settings = Object.assign({}, FlexCarouselIndicator.defaults, config);

            [this.targetName, this.index, this.activeClass] = _getElementData(el, 'flex-carousel-indicator').split(':');
            this.index = parseInt(this.index);
            this.activeClass = this.activeClass || this.settings.activeClass;

            let targets = _getRegistrySet(this.targetName);

            targets.forEach((target) => {
                if (target && target.el) {
                    target.el.addEventListener('fc:slid', (e) => this.onslid(e));
                }
            });
        }

        onslid(e) {
            let currentIndex = parseInt(e.detail),
                active = currentIndex === this.index;

            if (active) {
                this.el.setAttribute('data-flex-carousel-indicator-active', '');
            } else {
                this.el.removeAttribute('data-flex-carousel-indicator-active');
            }

            if (this.activeClass) {
                this.el.classList.toggle(this.activeClass, active);
            }
        }

        static get defaults() {
            return _defaults.FlexCarouselIndicator;
        }

        static set defaults(defaults) {
            _defaults.FlexCarouselIndicator = defaults;
        }
    }

    w.FlexCarousel = FlexCarousel;
    w.FlexCarouselControl = FlexCarouselControl;
    w.FlexCarouselIndicator = FlexCarouselIndicator;

    d.addEventListener('fc:init', function () {
        d.querySelectorAll('[data-flex-carousel],[flex-carousel]').forEach((el) => new FlexCarousel(el));
        d.querySelectorAll('[data-flex-carousel-control],[flex-carousel-control]').forEach((el) => new FlexCarouselControl(el));
        d.querySelectorAll('[data-flex-carousel-indicator],[flex-carousel-indicator]').forEach((el) => new FlexCarouselIndicator(el));
    });

    document.dispatchEvent(new CustomEvent('fc:init'));
})(window, document);