class CreateUpdateTagController {

  constructor($element) {
    this.$element = $element
    this.$element[0].style.setProperty('--saturation', config.hsv_defaults.saturation * 100+'%')    
    this.$element[0].style.setProperty('--value', config.hsv_defaults.value * 100+'%')
  }
}

CreateUpdateTagController.$inject = ['$element']

let createUpdateTag = {
  template: `
    <!-- https://codepen.io/yehao/pen/NNdzQx -->    
    <style scoped>
    .hue {
      background: linear-gradient(to right, hsl(0,var(--saturation),var(--value)) 0%,hsl(14.4,var(--saturation),var(--value)) 4%,
        hsl(28.8,var(--saturation),var(--value)) 8%,hsl(43.2,var(--saturation),var(--value)) 12%,hsl(57.6,var(--saturation),var(--value)) 16%,
        hsl(72,var(--saturation),var(--value)) 20%,hsl(86.4,var(--saturation),var(--value)) 24%,hsl(100.8,var(--saturation),var(--value)) 28%,
        hsl(115.2,var(--saturation),var(--value)) 32%,hsl(129.6,var(--saturation),var(--value)) 36%,hsl(144,var(--saturation),var(--value)) 40%,
        hsl(158.4,var(--saturation),var(--value)) 44%,hsl(172.8,var(--saturation),var(--value)) 48%,hsl(187.2,var(--saturation),var(--value)) 52%,
        hsl(201.6,var(--saturation),var(--value)) 56%,hsl(216,var(--saturation),var(--value)) 60%,hsl(230.4,var(--saturation),var(--value)) 64%,
        hsl(244.8,var(--saturation),var(--value)) 68%,hsl(259.2,var(--saturation),var(--value)) 72%,hsl(273.6,var(--saturation),var(--value)) 76%,
        hsl(288,var(--saturation),var(--value)) 80%,hsl(302.4,var(--saturation),var(--value)) 84%,hsl(316.8,var(--saturation),var(--value)) 88%,
        hsl(331.2,var(--saturation),var(--value)) 92%,hsl(345.6,var(--saturation),var(--value)) 96%,hsl(360,var(--saturation),var(--value)) 100%);
        border-radius: 3px;
        border-style: solid;
        border-width: thin;
    }
    </style>
    <div>
      <form class="form-horizontal">
        <div class="form-group">
          <label class="col-sm-4 control-label">Name</label>
          <div class="col-sm-8">
            <input type="text" class="form-control" ng-model="$ctrl.tag.name">
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-4 control-label">Description</label>
          <div class="col-sm-8">
            <input type="text" class="form-control" ng-model="$ctrl.tag.description">
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-4 control-label">Color Hue</label>
          <div class="col-sm-8">
            <div class="hue"><input name="hue" type="range" min="0" max="1" step="0.01" ng-model="$ctrl.tag.colourHue"></div>
          </div>  
        </div>  
      </form>
    </div>
  `,
  bindings: {
    tag: '='
  },
  controller: CreateUpdateTagController
}

export default createUpdateTag