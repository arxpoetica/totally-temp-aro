# The accordion component

## The accordion component can be used in the following way:

```html
<!-- Incude both the accordion-component.js and accordion-panel-component.js in your HTML file -->

<!-- First declare a parent div (or any other element) that will contain the accordion -->
<div style="position: absolute; background-color: blue; left: 200px; top: 200px; width: 400px; height: 400px">

  <!-- Then declare the accordion controller. Specify the panel ID of the panel that will be expanded initially
        Note that panel IDs are sent as strings ("'One'", not "One") -->
  <accordion initial-expanded-panel="'One'">

    <!-- Each accordion panel is described by a pair of title and contents elements. This was done because the
         flexbox requires elements with "flex" to be immediate children, and nesting title and contents within
         a parent DIV was not working well when adding scrollbars (overflow-y) to the contents -->
    <accordion-panel-title title="'Panel title'" panel-id="'One'"></accordion-panel-title>
    <accordion-panel-contents panel-id="'One'"> <!-- Note that the panel-id must match the panel-id of the title element for this panel -->
      Custom content<br>
      Custom content<br>
      Custom content<br>
      Custom content<br>
      Custom content<br>
    </accordion-panel>

    <accordion-panel-title title="'Another Panel title'" panel-id="'Two'"></accordion-panel-title>
    <accordion-panel-contents panel-id="'Two'">
      Custom content<br>
    </accordion-panel>

    <!-- ... keep repeating panel title and contents for as many panels that you want -->

  </accordion>
</div>
```