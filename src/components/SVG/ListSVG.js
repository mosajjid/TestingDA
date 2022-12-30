import React from 'react'

function ListSVG() {
  return (
    <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_dd_24_2609)">
        <path d="M12 3H19V21H5V3H12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.5 3.5V6.5H9.5V3.5" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 10H12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 13H14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 16H15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </g>
        <defs>
        <filter id="filter0_dd_24_2609" x="-4" y="0" width="32" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_24_2609"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="effect1_dropShadow_24_2609" result="effect2_dropShadow_24_2609"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_24_2609" result="shape"/>
        </filter>
        </defs>
    </svg>
  )
}

export default ListSVG
