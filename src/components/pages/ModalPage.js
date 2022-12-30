import React, { useState, useEffect } from 'react';
import Modal from '../components/AccountModal/ProgressModal'

const ModalPage = () => {

  const [isModalOpen, setModalIsOpen] = useState(false);
	const toggleModal = () => {
		setModalIsOpen(!isModalOpen);
	};

  return (
    <div>
          {isModalOpen && <Modal onRequestClose={toggleModal} />}
          <button onClick={toggleModal} type="button" className='main_btn'>
            Show the modal
          </button>
    </div>
  )
}

export default ModalPage
