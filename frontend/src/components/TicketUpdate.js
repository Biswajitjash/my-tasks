import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ticketAPI } from '../utils/api';
import VoiceInputButton from './VoiceInputButton';

const TicketUpdate = ({ currentUser }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'General', priority: 'Medium', status: 'Open', userTo: '2', feedback: 0
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await ticketAPI.getAllUsers();
      setUsers(response.data);
    } catch (err) { console.error("Failed to fetch users", err); }
  };

  const fetchTicket = useCallback(async () => {
    try {
      const response = await ticketAPI.getTicket(id);
      const ticketData = response.data;
      setTicket(ticketData);
      setFormData({
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        status: ticketData.status,
        userTo: ticketData.userTo ? String(ticketData.userTo) : '2',
        feedback: ticketData.feedback ? parseInt(ticketData.feedback) : 0,
      });
      if (ticketData.image) setImagePreview(`${process.env.BACKEND_URL}${ticketData.image}`);
    } catch (err) { setError('Failed to load ticket'); }
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'feedback' ? parseInt(value) : value 
    });
    setError('');
  };

  const handleStarClick = (starValue) => {
    setFormData({ ...formData, feedback: starValue });
    setError('');
  };

  const handleVoiceTranscript = useMemo(() => (fieldName) => (transcript, mode) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: mode === 'replace' ? transcript : prev[fieldName]
        ? prev[fieldName] + ' ' + transcript
        : transcript,
    }));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
      if (file.size > 5 * 1024 * 1024) { setError('Image size should be less than 5MB'); return; }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // ✅ For Resolved tickets, use the dedicated feedback route
      if (ticket.status === 'Resolved') {
        const feedbackData = {
          feedback: formData.feedback
        };
        console.log('Submitting feedback:', feedbackData);
        await ticketAPI.submitFeedback(id, feedbackData);
        setSuccess('Feedback submitted successfully! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      // ✅ For non-Resolved tickets, send as FormData (with possible image)
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('priority', formData.priority);
      data.append('status', formData.status);
      data.append('userTo', formData.userTo);
      data.append('feedback', formData.feedback);

      if (image) data.append('image', image);
      
      console.log('Updating ticket...');
      await ticketAPI.update(id, data);
      setSuccess('Ticket updated successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.error || 'Failed to update. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  if (!ticket) return (
    <div className="page-container">
      <div className="text-center"><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>
    </div>
  );

  if (ticket.status !== 'Resolved') return (
    <div className="page-container">


      <div className="page-header">
        <h1 className="page-title">Update Ticket</h1>
        <p className="page-subtitle">Modify ticket details · 🎤 Voice input supported</p>
      </div>

      <div className="auth-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}
        {success && <div className="alert alert-success"><span>✓</span><span>{success}</span></div>}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Brief description of the issue"
                style={{ flex: 1 }}
              />
              <VoiceInputButton
                fieldName="title"
                onTranscript={handleVoiceTranscript('title')}
                mode="replace"
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <textarea
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Provide detailed information about the issue..."
                style={{ flex: 1 }}
              />
              <VoiceInputButton
                fieldName="description"
                onTranscript={handleVoiceTranscript('description')}
                mode="append"
              />
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                <option value="General">General</option>
                <option value="Tour">Tour</option>
                <option value="Technical Change Require">Technical</option>
                <option value="New Development Request">Feature Request</option>
                <option value="Functional Change Request">Change Request</option>
                <option value="Meeting Schedule">Meeting Schedule</option>
                <option value="Bug Report">Bug Report</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <select name="priority" className="form-select" value={formData.priority} onChange={handleChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assigned To</label>
              <select name="userTo" className="form-select" value={String(formData.userTo)} onChange={handleChange}>
                {users.map(user => (
                  <option key={user.id} value={String(user.id)}>{user.username}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">Update Image (Optional)</label>
            <div className="file-upload-container">
              <label className="file-upload-label">
                <input type="file" className="file-upload-input" accept="image/*" onChange={handleImageChange} />
                <span style={{ fontSize: '1.5rem' }}>📁</span>
                <span className="file-upload-text">{image ? image.name : 'Click to upload new image (Max 5MB)'}</span>
              </label>
              {imagePreview && (
                <div className="file-preview">
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
                </div>
              )}
            </div>
          </div>



          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: '1', minWidth: '120px' }}>
              {loading ? <span className="spinner"></span> : 'Update Ticket'}
            </button>

            <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ flex: '1', minWidth: '120px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (ticket.status === 'Resolved') return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Update Ticket</h1>
        <p className="page-subtitle">Modify ticket details · 🎤 Voice input supported</p>
      </div>

      <div className="auth-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}
        {success && <div className="alert alert-success"><span>✓</span><span>{success}</span></div>}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">{ticket.title}</label>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <textarea
                name="description"
                className="form-textarea"
                value={ticket.description}
                readOnly
                rows="5"
                placeholder="Provide detailed information about the issue..."
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {/* Star Rating Feedback */}
          <div className="form-group">
            <label className="form-label">Feedback Rating (1-5 Stars)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                  }}
                  style={{
                    fontSize: '2.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: star <= formData.feedback ? '#FFD700' : '#ddd',
                    transition: 'color 0.2s, transform 0.2s',
                    padding: '0.25rem',
                  }}
                >
                  ★
                </button>
              ))}
              <span style={{ marginLeft: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {formData.feedback > 0 ? `${formData.feedback}/5` : 'Select rating'}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || formData.feedback === 0} 
              style={{ flex: '1', minWidth: '120px' }}
            >
              {loading ? <span className="spinner"></span> : 'Submit Feedback'}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/dashboard')} 
              style={{ flex: '1', minWidth: '120px' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

export default TicketUpdate;


// import { useState, useEffect, useCallback, useMemo } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { ticketAPI } from '../utils/api';
// import VoiceInputButton from './VoiceInputButton';

// const TicketUpdate = ({ currentUser }) => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const [ticket, setTicket] = useState(null);
//   const [users, setUsers] = useState([]);
//   const [formData, setFormData] = useState({
//     title: '', description: '', category: 'General', priority: 'Medium', status: 'Open', userTo: '2', feedback: 0
//   });
//   const [image, setImage] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [loading, setLoading] = useState(false);

//   useEffect(() => { fetchUsers(); }, [currentUser]);

//   const fetchUsers = async () => {
//     try {
//       const response = await ticketAPI.getAllUsers();
//       setUsers(response.data);
//     } catch (err) { console.error("Failed to fetch users", err); }
//   };

//   const fetchTicket = useCallback(async () => {
//     try {
//       const response = await ticketAPI.getTicket(id);
//       const ticketData = response.data;
//       setTicket(ticketData);
//       setFormData({
//         title: ticketData.title,
//         description: ticketData.description,
//         category: ticketData.category,
//         priority: ticketData.priority,
//         status: ticketData.status,
//         userTo: ticketData.userTo ? String(ticketData.userTo) : '2',
//         feedback: ticketData.feedback ? parseInt(ticketData.feedback) : 0,
//       });
//       if (ticketData.image) setImagePreview(`${process.env.BACKEND_URL}${ticketData.image}`);
//     } catch (err) { setError('Failed to load ticket'); }
//   }, [id]);

//   useEffect(() => { fetchTicket(); }, [fetchTicket]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ 
//       ...formData, 
//       [name]: name === 'feedback' ? parseInt(value) : value 
//     });
//     setError('');
//   };

//   const handleStarClick = (starValue) => {
//     setFormData({ ...formData, feedback: starValue });
//     setError('');
//   };

//   const handleVoiceTranscript = useMemo(() => (fieldName) => (transcript, mode) => {
//     setFormData((prev) => ({
//       ...prev,
//       [fieldName]: mode === 'replace' ? transcript : prev[fieldName]
//         ? prev[fieldName] + ' ' + transcript
//         : transcript,
//     }));
//   }, []);

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
//       if (file.size > 5 * 1024 * 1024) { setError('Image size should be less than 5MB'); return; }
//       setImage(file);
//       setImagePreview(URL.createObjectURL(file));
//       setError('');
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccess('');
    
//     try {
//       // ✅ For Resolved tickets, send feedback as JSON only
//       if (ticket.status === 'Resolved') {
//         const feedbackData = {
//           feedback: formData.feedback
//         };
//         console.log('Sending feedback data:', feedbackData);
//         await ticketAPI.update(id, feedbackData);
//         setSuccess('Feedback submitted successfully! Redirecting...');
//         setTimeout(() => navigate('/dashboard'), 2000);
//         return;
//       }

//       // ✅ For non-Resolved tickets, send as FormData (with possible image)
//       const data = new FormData();
//       data.append('title', formData.title);
//       data.append('description', formData.description);
//       data.append('category', formData.category);
//       data.append('priority', formData.priority);
//       data.append('status', formData.status);
//       data.append('userTo', formData.userTo);
//       data.append('feedback', formData.feedback);

//       if (image) data.append('image', image);
      
//       console.log('Sending ticket update data...');
//       await ticketAPI.update(id, data);
//       setSuccess('Ticket updated successfully! Redirecting...');
//       setTimeout(() => navigate('/dashboard'), 2000);
//     } catch (err) {
//       console.error('Submit error:', err);
//       setError(err.response?.data?.error || 'Failed to update ticket. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };


//   if (!ticket) return (
//     <div className="page-container">
//       <div className="text-center"><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>
//     </div>
//   );

//   if (ticket.status !== 'Resolved') return (
//     <div className="page-container">


//       <div className="page-header">
//         <h1 className="page-title">Update Ticket</h1>
//         <p className="page-subtitle">Modify ticket details · 🎤 Voice input supported</p>
//       </div>

//       <div className="auth-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
//         {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}
//         {success && <div className="alert alert-success"><span>✓</span><span>{success}</span></div>}

//         <form onSubmit={handleSubmit}>
//           {/* Title */}
//           <div className="form-group">
//             <label className="form-label">Title</label>
//             <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
//               <input
//                 type="text"
//                 name="title"
//                 className="form-input"
//                 value={formData.title}
//                 onChange={handleChange}
//                 required
//                 placeholder="Brief description of the issue"
//                 style={{ flex: 1 }}
//               />
//               <VoiceInputButton
//                 fieldName="title"
//                 onTranscript={handleVoiceTranscript('title')}
//                 mode="replace"
//               />
//             </div>
//           </div>

//           {/* Description */}
//           <div className="form-group">
//             <label className="form-label">Description</label>
//             <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
//               <textarea
//                 name="description"
//                 className="form-textarea"
//                 value={formData.description}
//                 onChange={handleChange}
//                 required
//                 rows="5"
//                 placeholder="Provide detailed information about the issue..."
//                 style={{ flex: 1 }}
//               />
//               <VoiceInputButton
//                 fieldName="description"
//                 onTranscript={handleVoiceTranscript('description')}
//                 mode="append"
//               />
//             </div>
//           </div>

//           {/* Grid */}
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
//             <div className="form-group" style={{ marginBottom: 0 }}>
//               <label className="form-label">Category</label>
//               <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
//                 <option value="General">General</option>
//                 <option value="Tour">Tour</option>
//                 <option value="Technical Change Require">Technical</option>
//                 <option value="New Development Request">Feature Request</option>
//                 <option value="Functional Change Request">Change Request</option>
//                 <option value="Meeting Schedule">Meeting Schedule</option>
//                 <option value="Bug Report">Bug Report</option>
//               </select>
//             </div>
//             <div className="form-group" style={{ marginBottom: 0 }}>
//               <label className="form-label">Priority</label>
//               <select name="priority" className="form-select" value={formData.priority} onChange={handleChange}>
//                 <option value="Low">Low</option>
//                 <option value="Medium">Medium</option>
//                 <option value="High">High</option>
//                 <option value="Urgent">Urgent</option>
//               </select>
//             </div>
//             <div className="form-group" style={{ marginBottom: 0 }}>
//               <label className="form-label">Status</label>
//               <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
//                 <option value="Open">Open</option>
//                 <option value="In Progress">In Progress</option>
//                 <option value="Resolved">Resolved</option>
//                 <option value="Closed">Closed</option>
//               </select>
//             </div>
//             <div className="form-group" style={{ marginBottom: 0 }}>
//               <label className="form-label">Assigned To</label>
//               <select name="userTo" className="form-select" value={String(formData.userTo)} onChange={handleChange}>
//                 {users.map(user => (
//                   <option key={user.id} value={String(user.id)}>{user.username}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Image Upload */}
//           <div className="form-group">
//             <label className="form-label">Update Image (Optional)</label>
//             <div className="file-upload-container">
//               <label className="file-upload-label">
//                 <input type="file" className="file-upload-input" accept="image/*" onChange={handleImageChange} />
//                 <span style={{ fontSize: '1.5rem' }}>📁</span>
//                 <span className="file-upload-text">{image ? image.name : 'Click to upload new image (Max 5MB)'}</span>
//               </label>
//               {imagePreview && (
//                 <div className="file-preview">
//                   <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
//                 </div>
//               )}
//             </div>
//           </div>



//           {/* Buttons */}
//           <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
//             <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: '1', minWidth: '120px' }}>
//               {loading ? <span className="spinner"></span> : 'Update Ticket'}
//             </button>

//             <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ flex: '1', minWidth: '120px' }}>
//               Cancel
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );

//   if (ticket.status === 'Resolved') return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1 className="page-title">Update Ticket</h1>
//         <p className="page-subtitle">Modify ticket details · 🎤 Voice input supported</p>
//       </div>

//       <div className="auth-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
//         {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}
//         {success && <div className="alert alert-success"><span>✓</span><span>{success}</span></div>}

//         <form onSubmit={handleSubmit}>
//           {/* Title */}
//           <div className="form-group">
//             <label className="form-label">{ticket.title}</label>
//           </div>

//           {/* Description */}
//           <div className="form-group">
//             <label className="form-label">Description</label>
//             <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
//               <textarea
//                 name="description"
//                 className="form-textarea"
//                 value={ticket.description}
//                 readOnly
//                 rows="5"
//                 placeholder="Provide detailed information about the issue..."
//                 style={{ flex: 1 }}
//               />
//             </div>
//           </div>

//           {/* Star Rating Feedback */}
//           <div className="form-group">
//             <label className="form-label">Feedback Rating (1-5 Stars)</label>
//             <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
//               {[1, 2, 3, 4, 5].map((star) => (
//                 <button
//                   key={star}
//                   type="button"
//                   onClick={() => handleStarClick(star)}
//                   onMouseEnter={(e) => {
//                     e.target.style.transform = 'scale(1.2)';
//                   }}
//                   onMouseLeave={(e) => {
//                     e.target.style.transform = 'scale(1)';
//                   }}
//                   style={{
//                     fontSize: '2.5rem',
//                     background: 'none',
//                     border: 'none',
//                     cursor: 'pointer',
//                     color: star <= formData.feedback ? '#FFD700' : '#ddd',
//                     transition: 'color 0.2s, transform 0.2s',
//                     padding: '0.25rem',
//                   }}
//                 >
//                   ★
//                 </button>
//               ))}
//               <span style={{ marginLeft: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
//                 {formData.feedback > 0 ? `${formData.feedback}/5` : 'Select rating'}
//               </span>
//             </div>
//           </div>

//           {/* Buttons */}
//           <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
//             <button 
//               type="submit" 
//               className="btn btn-primary" 
//               disabled={loading || formData.feedback === 0} 
//               style={{ flex: '1', minWidth: '120px' }}
//             >
//               {loading ? <span className="spinner"></span> : 'Submit Feedback'}
//             </button>

//             <button 
//               type="button" 
//               className="btn btn-secondary" 
//               onClick={() => navigate('/dashboard')} 
//               style={{ flex: '1', minWidth: '120px' }}
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );

// };

// export default TicketUpdate;

