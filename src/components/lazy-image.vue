<script lang="ts" setup>
import { defineProps, ref } from 'vue';

const props = defineProps<{
  nodeKey: string
  src: string
  altText: string
  className: string | null
  outclassName: string | null
  width: 'inherit' | number
  height: 'inherit' | number
  maxWidth: number
  nodeKet: number
  imageRef: { value: null | HTMLImageElement }
}>()

const imageRef = ref<null | HTMLImageElement>(null);
</script>

<template>
  <div
    class="image-node-style" :class="props.outclassName || undefined"
  >
    <img
      ref="imageRef"
      :class="className || undefined"
      :src="props.src"
      :alt="props.nodeKey"
      :style="{
        width: `${props.width}%`,
      }"
      draggable="false"
    />
  </div>
</template>

<style scoped lang="scss">
img{
  pointer-events: auto;
  box-sizing: border-box;
  z-index: 10;
}
.image-outline{
  outline: 2px solid #1A7EF8;

  .left-bar{
    width: 2px;
    left: -2px;
    background: #1A7EF8;
    border-radius: 2px;
    height: 100%;
    position: absolute;
    &:before{
      content: '';
      display: block;
      width: 8px;
      height: 47px;
      background: #1A7EF8;
      position: absolute;
      bottom: calc(48% - 18px);
      left:-3px;
      border-radius: 8px;
    }
    &:after{
      content: '';
      display: block;
      position: absolute;
      bottom: calc(48% - 4px);
      left:-1px;
      width: 1px;
      height: 14.39px;
      background: #1A7EF8;
      border-radius: 2px;
    }
  }
}
.image-node-style{
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9;
  &:hover{
    .left-bar{
      width: 2px;
      left: -2px;
      background: #E6E6E6;
      border-radius: 2px;
      height: 100%;
      position: absolute;
      &:before{
        content: '';
        display: block;
        width: 8px;
        height: 47px;
        background: #fff;
        position: absolute;
        bottom: calc(48% - 18px);
        left:-3px;
        border-radius: 8px;
      }
      &:after{
        content: '';
        display: block;
        position: absolute;
        bottom: calc(48% - 4px);
        left:-1px;
        width: 1px;
        height: 14.39px;
        background: #fff;
        border-radius: 2px;
      }
    }
    .right-bar{
      width: 2px;
      background: #E6E6E6;
      border-radius: 2px;
      height: 100%;
      right: -2px;
      position: absolute;
      &:before{
        content: '';
        display: block;
        width: 8px;
        height: 47px;
        background: #fff;
        position: absolute;
        bottom: calc(48% - 18px);
        left:-3px;
        border-radius: 8px;
      }
      &:after{
        content: '';
        display: block;
        position: absolute;
        bottom: calc(48% - 4px);
        left:-1px;
        width: 1px;
        height: 14.39px;
        background: #fff;
        border-radius: 2px;
      }
    }

  }
}
.left-bar,.right-bar{
  position: absolute;
  height: 100%;
  width: 100%;

}

</style>
