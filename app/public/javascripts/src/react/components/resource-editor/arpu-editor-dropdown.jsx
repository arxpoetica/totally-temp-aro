import React from 'react'

export const Dropdown = ({ product }) =>
  <div className="select-dropdown">
    {/* <button className="toggle" on:click={() => open = !open}> */}
    <button className="toggle">
      ${product.arpu} | ${product.opex} | ${product.fixedCost}
      {/* <span className="svg"><Caret/></span> */}
    </button>
    {/* <div className="dropdown" class:open> */}
    <div className="dropdown">
      <ul>
        <li>
          <h4>ARPU</h4>
          <p>Avg. Revenue Per User</p>
          <div className="input">
            {/* <input type="number" bind:value={product.arpu}> */}
            <input type="number"/>
          </div>
        </li>
        <li>
          <h4>OPEX</h4>
          <p>Operating Expense</p>
          <div className="input">
            {/* <input type="number" bind:value={product.opex}> */}
            <input type="number"/>
          </div>
        </li>
        <li>
          <h4>Cost</h4>
          <p>Acquisition <br/>Cost</p>
          <div className="input">
            {/* <input type="number" bind:value={product.fixedCost}> */}
            <input type="number"/>
          </div>
        </li>
      </ul>
      {/* <button
        type="button"
        className="close"
        aria-label="Close"
        on:click={() => open = !open}
      >
        <span aria-hidden="true">&times;</span>
      </button> */}
    </div>
  </div>
