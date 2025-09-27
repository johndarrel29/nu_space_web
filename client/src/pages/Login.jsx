import classNames from 'classnames';
import { Outlet } from 'react-router-dom';
import Logo from "../assets/images/NUSpace_new.png";
import { Header } from "../components";
import style from '../css/Login.module.css';


export default function Login() {

    return (
        // <div className={classNames(style.container, style.clearfix)}>
        <div className='flex h-screen'>
            <div className={`${style["left-container"]} w-full md:w-1/3 pt-6`}>
                <div className={style.heading}>
                    <Header theme="dark" />
                </div>
                <div className='flex items-center w-full justify-center mt-[100px] px-8'>
                    <Outlet />
                </div>
            </div>

            <div className={classNames(style['right-container'], 'relative')}>
                {/* <img src={Background} alt="Background Image" className="w-full h-full object-cover" /> */}
                <div className='w-full h-full bg-primary'></div>
                <img src={Logo} alt="" className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 lg:h-40 motion-preset-focus  motion-duration-800 ' />
                {/* <img src={Logo} alt="Logo Image" draggable="false" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 motion-preset-focus  motion-duration-800 " /> */}
            </div>
        </div>

    );


}

