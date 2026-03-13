import { useState } from "react";
import { Users, UserCheck, UserX, Plus, X, CheckCircle } from "lucide-react";
import { StatCard, SearchBar, Tabs, EmptyState, Modal, Input, Select } from '../shared';



const VisitorManagement = () => {
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    visitorType: "",
    fullName: "",
    contact: "",
    visitDate: "",
    email: "",
    visitTime: "",
    vehicle: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="container py-4" style={{ fontFamily: "Inter, Montserrat, sans-serif" }}>
      {/* Header */}
      <h4 className="fw-semibold mb-4">Visitor Management</h4>

      {/* Stats */}
      <div className="ue-stat-grid" style={{ marginBottom: 16 }}>
        <StatCard label="Total Visitors Today" value="0" icon={<Users size={22} />} iconColor="#16a34a" iconBg="#dcfce7" />
        <StatCard label="Checked Out Visitors" value="0" icon={<UserX size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
        <StatCard label="Active Visitors" value="0" icon={<UserCheck size={22} />} iconColor="#2563eb" iconBg="#dbeafe" />
      </div>


      {/* Add Visitor */}
      <button
        className="btn btn-outline-warning w-100 mb-4 d-flex align-items-center gap-2 justify-content-center"
        style={{ borderRadius: "10px" }}
        onClick={() => setShowModal(true)}
      >
        <Plus />
        Add New Visitor
      </button>

      {/* Search & Export */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <SearchBar placeholder="Search by name, date, status..." value="" onChange={() => { }} />
        </div>
        <button className="btn btn-warning text-white">Export</button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: 'All Visitors', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Checked Out', value: 'checked_out' },
        ]}
        active="all"
        onChange={() => { }}
        variant="underline"
      />

      {/* Empty State */}
      <EmptyState icon={<Users size={48} />} title="No Visitors Found" sub="Add new visitors to see them listed here" />


      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title="Add a Visitor"
        size="lg"
        footer={
          <>
            <button onClick={closeModal} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#d97706', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Submit Request
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Select
            label="Type of visitor"
            name="visitorType"
            onChange={handleChange}
            options={[
              { label: 'Guest', value: 'Guest' },
              { label: 'Delivery', value: 'Delivery' },
              { label: 'Service', value: 'Service' },
            ]}
            placeholder="Select visitor type"
          />
          <Input label="Contact number" placeholder="10 digit mobile number" name="contact" onChange={handleChange} />
          <Input label="Full name" placeholder="Enter visitor's full name" name="fullName" onChange={handleChange} />
          <Input label="Email address" type="email" placeholder="visitor@example.com" name="email" onChange={handleChange} />
          <Input type="date" label="Visit date" name="visitDate" onChange={handleChange} />
          <Input type="time" label="Visit time" name="visitTime" onChange={handleChange} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Vehicle number" placeholder="Optional" name="vehicle" onChange={handleChange} hint="Optional — leave blank if no vehicle" />
          </div>
        </div>
      </Modal>

    </div>
  );
};

export { VisitorManagement };

