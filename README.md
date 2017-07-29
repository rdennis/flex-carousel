# flex-carousel
A carousel using flexbox.

# Planned Features
- [x] `aria` support
- [x] initialize components automatically
- [ ] event hooks?
    - [x] `fc:init`
    - [x] `fc:play`
    - [x] `fc:pause`
    - [x] `fc:slide`
- [ ] support `flex-direction: column`?

# Usage


## `data-flex-carousel` 

Used to mark an element as a carousel in a carousel group. The value should be the name of the carousel item. Having multiple carousels with the same name is supported.

Syntax: `data-flex-carousel="<carousel-group-name>"`


## `data-flex-carousel-control` 

Used to mark an element as a control for a given carousel group.

Syntax: `data-flex-carousel-control="<carousel-group-name>:<event>:<parameter>"`


## `data-flex-carousel-item` _optional_

Used to configure an individual item of the carousel.

Syntax: `data-flex-carousel-item="<property>: <value>; <property>: <value>;..."`

Available properties:
- speed: the time (in ms) the item will be visible


## JS Initialization

By default, all tags marked with `[data-flex-carousel]` or `[data-flex-carousel-control]` are initialized when flex-carousel loads. This can prevented by stopping the `fc:init` event on the `document`. You can then create the components yourself.

```javascript
document.addEventListener('fc:init', (e) => {
    e.stopImmediatePropagation();

    let carousel = new FlexCarousel(document.getElementById('my-carousel'));

    let nextButton = new FlexCarouselControl(document.getElementById('next-button'));
});
```


# Examples

```html
<div class="carousel-wrapper">
    <div class="carousel" data-flex-carousel="carousel">
        <div>...</div>
        <div>...</div>
        ...
    </div>
    <ul>
        <li data-flex-carousel-control="carousel:slide:0">...</li>
        <li data-flex-carousel-control="carousel:slide:1">...</li>
        ...
    </ul>
    <button type="button" data-flex-carousel-control="carousel:slide:-1">Prev</button>
    <button type="button" data-flex-carousel-control="carousel:slide:+1">Next</button>
    <button type="button" data-flex-carousel-control="carousel:slide:play">Play</button>
    <button type="button" data-flex-carousel-control="carousel:slide:pause">Pause</button>
</div>
```