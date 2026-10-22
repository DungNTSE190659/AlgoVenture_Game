import { ArrowRight,Check,MoveHorizontal } from "lucide-react";
import type { CSSProperties } from "react";
import type { Item } from "../engine/quicksort";
import { factoryAsset } from "../engine/mergeFactoryAssets";

type Props={items:Item[];variant:"intro"|"outro";paused:boolean;onContinue:()=>void};
export default function MergeParcelShowcase({items,variant,paused,onContinue}:Props){
  const sorted=variant==="outro";
  return <section className={`race-showcase ${sorted?"is-sorted":""}`} aria-label={sorted?"Các kiện hàng đã sắp xếp":"Các kiện hàng chưa sắp xếp"} data-variant={variant} data-paused={paused}>
    <div className="race-showcase-copy"><span>MERGE EXPRESS</span><h2>{sorted?"Tất cả đã vào đúng thứ tự!":"Kiện hàng đang lộn xộn!"}</h2><p>{sorted?"Từ bé đến lớn, giữ nguyên thứ tự các kiện bằng nhau.":"Gạt cần cho kiện nhỏ hơn qua trước. Hàng tự chạy — sai một kiện, dừng cả ca!"}</p></div>
    <div className="race-showcase-camera"><div className="race-showcase-parcels" style={{"--showcase-count":items.length}as CSSProperties}>{items.map((item,index)=><div key={item.id} className="race-showcase-parcel" data-item-id={item.id} data-value={item.value} style={{"--parcel-index":index}as CSSProperties}><img src={factoryAsset("parcel")} alt=""/><strong className={String(item.value).length>2?"is-long":""}>{item.value}</strong><small>{String.fromCharCode(65+item.id)}</small>{sorted&&<i><Check size={15}/></i>}</div>)}</div></div>
    <div className="race-showcase-actions">{!sorted&&<span><MoveHorizontal size={19}/> Kéo cần hoặc chạm để đổi A / B</span>}<button className="chunky-button button-green" onClick={onContinue}>{sorted?"Xem kết quả":"Vào ca"}<ArrowRight size={21}/></button>{sorted&&<small>Tự chuyển sang kết quả sau ít giây</small>}</div>
  </section>;
}
