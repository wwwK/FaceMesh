<template>
  <div class="gallery">
    <div v-for="item in data" :key="item.name" class="item" :class="{ active: current && current.name === item.name }" @click="onClick(item)">
      <div v-if="item.thumb" class="thumb" :style="{ backgroundImage: `url(${item.thumb})`, backgroundColor: item.thumbBg }"></div>
      <div v-else class="name">{{ item.name }}</div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { ModelData } from '../lib/helper'
import glassesModel from '../lib/models/glasses'
import zeldaModel from '../lib/models/zelda'
import barbaraModel from '../lib/models/barbara'

export default defineComponent({
  props: {
    autoSelectFirst: Boolean
  },
  setup(props, { emit }) {
    const data: ModelData[] = [
      {
        name: 'facepaint',
        thumb: '/textures/facepaint.png',
        type: 'texture',
        path: '/textures/facepaint.png'
      },
      {
        name: 'cheek',
        thumb: '/textures/cheek.png',
        thumbBg: 'white',
        type: 'texture',
        path: '/textures/cheek.png'
      },
      {
        name: 'makeup',
        thumb: '/textures/makeup.png',
        thumbBg: 'white',
        type: 'texture',
        path: '/textures/makeup.png'
      },
      {
        name: 'glasses',
        thumb: '',
        type: 'model',
        loader: glassesModel
      },
      {
        name: 'zelda',
        thumb: '',
        type: 'model',
        loader: zeldaModel
      },
      {
        name: 'barbara',
        thumb: '',
        type: 'model',
        loader: barbaraModel
      }
    ]
    const current = ref()
    const onClick = (item: any) => {
      current.value = item
      emit('change', item)
    }

    if (props.autoSelectFirst) {
      onClick(data[0])
    }

    return {
      data,
      current,
      onClick
    }
  }
})
</script>
<style lang="scss" scoped>
.gallery {
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  bottom: 0;
  background: #314249;
  overflow-x: hidden;
  overflow-y: auto;
  // &::-webkit-scrollbar {
  //   width: 0;
  // }
}
.item {
  margin: 20px;
  width: 100px;
  height: 100px;
  border-radius: 10px;
  overflow: hidden;
  background-color: hsla(0,0%,100%,.12549019607843137);
  border: 4px solid hsla(0,0%,100%,.12549019607843137);
  transition: .4s ease;
  &.active {
    border-color: rgb(0, 157, 247);
  }
}
.thumb {
  height: 100px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}
.name {
  color: white;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-top: 40px;
}
</style>
