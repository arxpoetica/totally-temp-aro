app.component('accordion', {
  template: `
    <style scoped>
      .accordion-container {
        position: relative; /* This will require the parent to have position: relative or absolute */
        height: 100%;
        display: flex;
        flex-direction: column;
      }
    </style>
    <div class="accordion-container">
      <ng-transclude></ng-transclude>
    </div>
  `,
  transclude: true,
  controller: function() 
  { this.index = 3 }
})

app.component('accordionPanel', {
  template: `
    <style scoped>
      .accordion-title {
        flex: 0 0 auto;
      }
      .accordion-contents {
        flex: 1 1 auto;
        transition: flex-grow 100ms, flex-shrink 100ms, visibility 0ms 100ms;
        overflow: hidden;
        max-height: 500px;
        overflow: auto;
      }
    </style>
    <div class="accordion-title">
      This is the title
      {{JSON.stringify($ctrl.parent)}}
    </div>
    <div class="accordion-contents">
      <ng-transclude></ng-transclude>
    </div>
  `,
  transclude: true,
  require: {
    parent: '^accordion'
  },
  controller: function($scope) { console.log(this.parent) },
  $ngOnInit: function() { console.log('init');console.log(this.parent) }
})