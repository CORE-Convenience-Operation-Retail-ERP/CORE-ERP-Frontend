import {
    Sidebar,
    SidebarMenu,
    MenuItem,
    MenuButton,
    MenuIcon,
    Submenu,
    SubmenuItem,
    SidebarFooter,
    FooterContent,
    FooterDetail,
    
} from '../../../features/store/styles/common/StoreSidebar.styled';
import {useState} from "react";

function StoreSidebar({ menus, hoverMenu, onMouseEnter, onMouseLeave, onNavigate, activeMenu }) {
    const [open, setOpen] = useState(false);
    const [spinning, setSpinning] = useState(false);
    const handleClick = () => {
        setSpinning(true);
        setOpen(o => !o);
    };

    const handleAnimationEnd = () => {
        setSpinning(false);
    };

    return (
        <Sidebar>
            <SidebarMenu>
                {menus.map((menu, idx) => {
                    const isActive = activeMenu === menu.path;
                    const hasActiveSubmenu = menu.submenu?.some(sub => activeMenu === sub.path);

                    return (
                        <MenuItem
                            key={idx}
                            onMouseEnter={() => onMouseEnter(menu.name)}
                            onMouseLeave={onMouseLeave}
                        >
                            <MenuButton
                                isActive={isActive || hasActiveSubmenu} // 메인 메뉴 active 처리
                                onClick={() => {
                                    if (!menu.submenu) {
                                        onNavigate(menu.path);
                                    }
                                }}
                            >
                                {menu.icon && (
                                    <MenuIcon size={10}>
                                        {menu.icon}
                                    </MenuIcon>
                                )}
                                  <span>{menu.name}</span>
                            </MenuButton>

                            {menu.submenu && (
                                <Submenu isOpen={hoverMenu === menu.name || hasActiveSubmenu}>
                                    {menu.submenu.map((sub, subIdx) => {
                                        const isSubActive = activeMenu === sub.path; // 하위 메뉴 active 처리

                                        return (
                                            <SubmenuItem
                                                key={subIdx}
                                                isActive={isSubActive}
                                                onClick={() => onNavigate(sub.path)}
                                                onMouseEnter={() => onMouseEnter(menu.name)}
                                                onMouseLeave={onMouseLeave}
                                            >
                                                {sub.name}
                                            </SubmenuItem>
                                        );
                                    })}
                                </Submenu>
                            )}
                        </MenuItem>
                    );
                })}
            </SidebarMenu>

            {/* Footer */}
            <SidebarFooter>
                <FooterDetail open={open}>
                    <strong>CORE ERP 시스템 v1.0</strong><br/>
                    문의 : core@company.com<br/>
                    전화 : 1234-5678<br/>
                    주소 : 서울특별시 강남구 테헤란로 123<br/>
                    운영시간: 월-금 09:00-18:00
                </FooterDetail>
                <FooterContent
                    size={15}
                    onClick={handleClick}
                    spinning={spinning}
                    onAnimationEnd={handleAnimationEnd}
                >
                    @ CORE ERP 
                </FooterContent>

            </SidebarFooter>
        </Sidebar>
    );
}

export default StoreSidebar;