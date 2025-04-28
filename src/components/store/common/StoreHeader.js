import { useState } from 'react';
import {
    Header,
    RightSection,
    IconWrap,
    LogoImage,
    MailIcon,
    BellIcon,
    LogoutIcon,
} from '../../../features/store/styles/common/StoreHeader.styled';

function StoreHeader({ userInfo, onLogout, onToggleNotifications }) {
    const [hoveredIcon, setHoveredIcon] = useState(null); // 🔥

    // if (!userInfo) return null;

    return (
        <Header>
            <LogoImage src="/core_logo.png" alt="Core 로고" />
            <RightSection>

                {/* Mail */}
                <IconWrap
                    hoverbg="#dbeafe" // 🔥 연파랑
                    onMouseEnter={() => setHoveredIcon('mail')}
                    onMouseLeave={() => setHoveredIcon(null)}
                >
                    <MailIcon $hovered={hoveredIcon === 'mail'} />
                </IconWrap>

                {/* Bell */}
                <IconWrap
                    hoverbg="#fef9c3" // 🔥 연노랑
                    onMouseEnter={() => setHoveredIcon('bell')}
                    onMouseLeave={() => setHoveredIcon(null)}
                >
                    <BellIcon $hovered={hoveredIcon === 'bell'} />
                </IconWrap>

                {/* Logout */}
                <IconWrap
                    hoverbg="#ffe4e6" // 🔥 연다홍
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

                {/* 직급 */}
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    {userInfo.empRole === "ROLE_OWNER"
                        ? `${userInfo.storeName} 점주님`
                        : "관리자님"}
                </div>

            </RightSection>
        </Header>
    );
}

export default StoreHeader;