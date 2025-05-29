import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../contexts/NotificationContext';

import {
    Header,
    RightSection,
    IconWrap,
    LogoImage,
    MailIcon,
    LogoutIcon,
    BuildingIcon,
} from '../../../features/store/styles/common/StoreHeader.styled';

import StoreNotificationIcon from './StoreNotificationIcon';

function StoreHeader({ userInfo, onLogout }) {


    const [hoveredIcon, setHoveredIcon] = useState(null);
    const navigate = useNavigate();
    const { unreadCount } = useNotification();


    return (
        <Header>
            <LogoImage src="/core_logo.png" alt="Core 로고" 
                onClick={() => navigate('/store/home')} style={{ cursor: 'pointer' }}/>
            <RightSection>

                {/* Mail */}
                <IconWrap
                    $hoverbg="#dbeafe" // 연파랑
                    onMouseEnter={() => setHoveredIcon('mail')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => navigate('/headquarters/board/store-inquiries')}
                >
                    <MailIcon $hovered={hoveredIcon === 'mail'} />
                </IconWrap>

                {/* Bell - 점주 알림 아이콘 (실시간, 뱃지+드롭박스) */}
                <StoreNotificationIcon />

                {/* 본사 이동 아이콘 (점주만 보임)  */}

                    <IconWrap
                        $hoverbg="#ede9fe" // 연보라
                        onMouseEnter={() => setHoveredIcon('hq')}
                        onMouseLeave={() => setHoveredIcon(null)}
                        onClick={() => navigate('/headquarters/board/notice')}
                    >

                        <BuildingIcon $hovered={hoveredIcon === 'hq'} />
                    </IconWrap>
                

                 {/* 직급 */}
                 <div style={{ fontSize: "14px", color: "#6b7280" }}>
                   
                        {userInfo.branchName || "지점명 없음"}
                        
                </div>

                {/* Logout */}
                <IconWrap
                    $hoverbg="#ffe4e6" // 연다홍
                    onMouseEnter={() => setHoveredIcon('logout')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={onLogout}
                    style={{ padding: "8px 12px", borderRadius: "50px" }}
                >
                    <LogoutIcon $hovered={hoveredIcon === 'logout'} />
                    <span style={{
                        marginLeft: "6px",
                        fontSize: "14px",
                        color: hoveredIcon === 'logout' ? '#fb7185' : '#6b7280',
                        transition: "color 0.3s ease"
                    }}>
                        Logout
                    </span>
                </IconWrap>

            </RightSection>
        </Header>
    );
}

export default StoreHeader;