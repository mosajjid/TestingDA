import React, { useState, useEffect, useRef } from "react";

const Clock = (props) => {
  const [state, setState] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [timeEnded, setTimeEnded] = useState(false);

  const intervalRef = useRef();


  useEffect(() => {
    const fetch = async () => {

      getTimeUntil(props.deadline);
      intervalRef.current = setInterval(
        async () => {
          getTimeUntil(props.deadline)
          if (timeEnded === true) {
            if (props.fetch)
              await props.fetch()
            clearInterval(intervalRef.current)

          }
        }, 1000);

    }
    clearInterval(intervalRef.current);
    fetch()
  }, [timeEnded, props.deadline])

  const leading0 = (num) => {
    return num < 10 ? "0" + num : num;
  }


  const getTimeUntil = async (deadline) => {
    let time = Date.parse(deadline) - Date.parse(new Date());
    if (time <= 0) {
      setState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeEnded(true)

    } else {
      const seconds = Math.floor((time / 1000) % 60);
      const minutes = Math.floor((time / 1000 / 60) % 60);
      const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
      const days = Math.floor(time / (1000 * 60 * 60 * 24));
      setState({ days, hours, minutes, seconds });
    }
  }
  // componentWillUnmount() {
  //   // fix Warning: Can't perform a React state update on an unmounted component
  //   this.setState = (state, callback) => {
  //     return;
  //   };
  // }
  // useEffect(() => {
  //   setState = (state, callback) => {
  //     return;
  //   };
  // })


  return (
    <div className='d-flex'>

      <div className='Clock-days'>{leading0(state.days)}d</div>
      <div className='Clock-hours'>{leading0(state.hours)}h</div>
      <div className='Clock-minutes'>
        {leading0(state.minutes)}m
      </div>
      <div className='Clock-seconds'>
        {leading0(state.seconds)}s
      </div>
    </div>
  );

}
export default Clock;


