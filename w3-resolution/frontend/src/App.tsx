import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TopicLayout from './components/TopicLayout'
import TopicView from './views/TopicView'

function App() {
  return (
    <BrowserRouter basename="/w3">
      <Routes>
        <Route path="/" element={<TopicLayout />}>
          {/* Redirect root to default topic */}
          <Route index element={<Navigate to="/topic/default" replace />} />

          {/* Topic view route */}
          <Route path="topic/:topicId" element={<TopicView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
