import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/tensorflow'
  },
  {
    path: '/faceMesh',
    component: () => import('./components/FaceMesh.vue')
  },
  {
    path: '/faceDetection',
    component: () => import('./components/FaceDetection.vue')
  },
  {
    path: '/tensorflow',
    component: () => import('./components/Tensorflow.vue')
  }
]
const router = createRouter({
  history: createWebHashHistory(),
  routes
})
export default router