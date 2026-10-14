# 스텔라(노란 대왕고래) 로우폴리 모델 만들기 → data/stella/Stella.glb
#
#   python3 tools/make_stella.py
#
# 다른 고래 모델과 같은 규칙: 머리 -x, 꼬리 +x, x 범위 -1 ~ 1 (헤엄 셰이더가 이 범위를 쓴다), 위가 +y.
# 몸통은 단면(타원)을 머리부터 꼬리까지 이어 붙이고, 지느러미는 얇은 판으로 붙인다.
# 텍스처: 기본 색(등은 진한 금색, 배는 크림색, 목주름, 얼룩무늬, 입선) + 빛나는 문양(등의 육각별).
# 숫자(몸 비율, 색, 별 위치)를 바꾸고 다시 실행하면 새 모델이 나온다.

import io
import json
import math
import random
import struct
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path( __file__ ).resolve().parent.parent / 'data' / 'stella' / 'Stella.glb'
TEX = 512
BODY_END = 0.84  # 몸통이 끝나는 x (그 뒤는 꼬리지느러미)

# ---------------------------------------------------------------
# 몸통 단면: t(0 머리 끝 → 1 꼬리 자루)마다 위쪽 반지름, 아래쪽 반지름, 옆 반지름, 중심 높이
# 대왕고래: 길고 날씬하고, 머리는 위에서 보면 넓적한 U자, 주름진 목 아래가 크게 부풀어 있다
# ---------------------------------------------------------------
PROFILE = [
	# t,    top,   bottom, side,  center
	( 0.00, 0.020, 0.030, 0.048, - 0.002 ),
	( 0.03, 0.040, 0.064, 0.092, - 0.008 ),
	( 0.08, 0.060, 0.104, 0.130, - 0.016 ),
	( 0.15, 0.086, 0.142, 0.154, - 0.020 ),
	( 0.24, 0.114, 0.166, 0.170, - 0.018 ),
	( 0.34, 0.132, 0.162, 0.173, - 0.012 ),
	( 0.45, 0.135, 0.140, 0.162, - 0.004 ),
	( 0.56, 0.120, 0.118, 0.140, 0.000 ),
	( 0.66, 0.098, 0.092, 0.108, 0.002 ),
	( 0.75, 0.075, 0.068, 0.072, 0.004 ),
	( 0.83, 0.055, 0.048, 0.042, 0.004 ),
	( 0.91, 0.036, 0.032, 0.024, 0.002 ),
	( 1.00, 0.020, 0.018, 0.016, 0.000 ),
]
STATIONS = [ 0.0, 0.015, 0.035, 0.06, 0.09, 0.13, 0.18, 0.24, 0.30, 0.37, 0.44, 0.51, 0.58, 0.65, 0.71, 0.77, 0.82, 0.87, 0.91, 0.95, 0.98, 1.0 ]
RING = 12  # 단면 둘레 꼭짓점 수


def profile_at( t ):

	for a, b in zip( PROFILE, PROFILE[ 1: ] ):
		if a[ 0 ] <= t <= b[ 0 ]:
			k = ( t - a[ 0 ] ) / ( b[ 0 ] - a[ 0 ] )
			k = k * k * ( 3 - 2 * k )
			return [ a[ i ] + ( b[ i ] - a[ i ] ) * k for i in range( 1, 5 ) ]
	return list( PROFILE[ - 1 ][ 1: ] )


NOSE = - 0.975  # 첫 단면 위치. 그 앞(-1.0)의 주둥이 끝점으로 둥글게 모은다


def body_x( t ):

	return NOSE + t * ( BODY_END - NOSE )


class Mesh:

	def __init__( self ):

		self.pos, self.uv, self.idx, self.seams = [], [], [], []

	def vert( self, p, uv ):

		self.pos.append( p )
		self.uv.append( uv )
		return len( self.pos ) - 1

	def tri( self, a, b, c, outward ):
		"""삼각형 앞면이 outward 쪽을 보도록 감는 방향을 맞춘다"""

		pa, pb, pc = ( np.array( self.pos[ i ] ) for i in ( a, b, c ) )
		if np.dot( np.cross( pb - pa, pc - pa ), outward ) < 0:
			b, c = c, b
		self.idx.append( ( a, b, c ) )


def build_body( m ):

	rings = []
	for t in STATIONS:
		top, bottom, side, cy = profile_at( t )
		x = body_x( t )
		ring = []
		for j in range( RING + 1 ):  # 마지막은 이음매용으로 첫 점을 한 번 더 (UV가 끊기지 않게)
			th = j / RING * 2 * math.pi
			c, s = math.cos( th ), math.sin( th )
			y = cy + ( top if c > 0 else bottom ) * c
			z = side * s
			ring.append( m.vert( ( x, y, z ), ( ( x + 1 ) / 2, j / RING ) ) )
		rings.append( ( ring, cy ) )
		m.seams.append( ( ring[ 0 ], ring[ RING ] ) )

	def out( i, j, k, cy ):
		c = ( np.array( m.pos[ i ] ) + m.pos[ j ] + m.pos[ k ] ) / 3
		return np.array( ( 0.0, c[ 1 ] - cy, c[ 2 ] ) )

	for ( a, ca ), ( b, cb ) in zip( rings, rings[ 1: ] ):
		cy = ( ca + cb ) / 2
		for j in range( RING ):
			m.tri( a[ j ], b[ j ], a[ j + 1 ], out( a[ j ], b[ j ], a[ j + 1 ], cy ) )
			m.tri( a[ j + 1 ], b[ j ], b[ j + 1 ], out( a[ j + 1 ], b[ j ], b[ j + 1 ], cy ) )

	# 주둥이 끝과 꼬리 자루 끝을 막는다
	first, last = rings[ 0 ][ 0 ], rings[ - 1 ][ 0 ]
	nose = m.vert( ( - 1.0, - 0.004, 0.0 ), ( 0.0, 0.5 ) )
	for j in range( RING ):
		m.tri( nose, first[ j ], first[ j + 1 ], ( - 1, 0, 0 ) )
	tail = m.vert( ( BODY_END + 0.02, 0.0, 0.0 ), ( ( BODY_END + 1.02 ) / 2, 0.0 ) )
	for j in range( RING ):
		m.tri( tail, last[ j ], last[ j + 1 ], ( 1, 0, 0 ) )


def lens( m, outline, center, normal, thick, v_top, v_bottom ):
	"""얇은 지느러미: 테두리는 날카롭고 가운데가 조금 두툼한 판. 윗면 · 아랫면을 따로 만든다"""

	n = np.array( normal, dtype = float )
	n /= np.linalg.norm( n )
	c = np.array( center, dtype = float )
	for side, v in ( ( 1, v_top ), ( - 1, v_bottom ) ):
		ci = m.vert( tuple( c + n * thick * side ), ( ( c[ 0 ] + 1 ) / 2, v ) )
		ids = [ m.vert( tuple( p ), ( ( p[ 0 ] + 1 ) / 2, v ) ) for p in outline ]
		for i in range( len( ids ) ):
			m.tri( ci, ids[ i ], ids[ ( i + 1 ) % len( ids ) ], n * side )


def build_fins( m ):

	# 꼬리지느러미: 넓고 얇게, 끝이 뒤로 젖혀지고 가운데가 살짝 파인 모양
	half = [ ( 0.80, 0.022 ), ( 0.87, 0.085 ), ( 0.93, 0.180 ), ( 1.00, 0.290 ), ( 0.983, 0.215 ), ( 0.962, 0.120 ), ( 0.952, 0.045 ) ]
	outline = [ ( x, 0.0, z ) for x, z in half ] + [ ( 0.945, 0.0, 0.0 ) ] + [ ( x, 0.0, - z ) for x, z in reversed( half ) ]
	lens( m, outline, ( 0.885, 0.0, 0.0 ), ( 0, 1, 0 ), 0.013, 0.02, 0.5 )

	# 가슴지느러미: 길고 가는 노 모양, 몸 아래 옆에서 뒤아래로
	for s in ( 1, - 1 ):
		fin = [ ( - 0.53, - 0.075, 0.145 * s ), ( - 0.47, - 0.105, 0.245 * s ), ( - 0.33, - 0.165, 0.335 * s ), ( - 0.385, - 0.125, 0.235 * s ), ( - 0.45, - 0.085, 0.150 * s ) ]
		cx = sum( p[ 0 ] for p in fin ) / len( fin )
		cy = sum( p[ 1 ] for p in fin ) / len( fin )
		cz = sum( p[ 2 ] for p in fin ) / len( fin )
		lens( m, fin, ( cx, cy, cz ), ( 0, 1, - 0.55 * s ), 0.010, 0.33, 0.5 )

	# 등지느러미: 꼬리 쪽에 작게
	t0 = ( 0.40 - NOSE ) / ( BODY_END - NOSE )
	top0 = profile_at( t0 )[ 0 ] + profile_at( t0 )[ 3 ]
	t1 = ( 0.50 - NOSE ) / ( BODY_END - NOSE )
	top1 = profile_at( t1 )[ 0 ] + profile_at( t1 )[ 3 ]
	dorsal = [ ( 0.40, top0 - 0.01, 0.0 ), ( 0.49, top1 + 0.026, 0.0 ), ( 0.51, top1 + 0.022, 0.0 ), ( 0.50, top1 - 0.01, 0.0 ) ]  # 작게: 크면 상어처럼 보인다
	lens( m, dorsal, ( 0.46, ( top0 + top1 ) / 2 + 0.01, 0.0 ), ( 0, 0, 1 ), 0.008, 0.02, 0.02 )


def normals( pos, idx, seams ):

	p = np.array( pos, dtype = np.float32 )
	n = np.zeros_like( p )
	for a, b, c in idx:
		f = np.cross( p[ b ] - p[ a ], p[ c ] - p[ a ] )
		n[ a ] += f
		n[ b ] += f
		n[ c ] += f
	# 등의 이음매(같은 자리의 점 두 개)는 명암이 끊기지 않게 합친다
	for a, b in seams:
		n[ a ] = n[ b ] = n[ a ] + n[ b ]
	n /= np.maximum( np.linalg.norm( n, axis = 1, keepdims = True ), 1e-8 )
	return n


# ---------------------------------------------------------------
# 텍스처 (u: 머리 0 → 꼬리 1, v: 등 0 → 오른쪽 옆 0.25 → 배 0.5 → 왼쪽 옆 0.75 → 등 1)
# ---------------------------------------------------------------
BACK = np.array( ( 222, 154, 28 ), float )
SIDE = np.array( ( 247, 194, 58 ), float )
BELLY = np.array( ( 255, 238, 178 ), float )


def base_texture():

	v = ( np.arange( TEX ) + 0.5 ) / TEX
	u = ( np.arange( TEX ) + 0.5 ) / TEX
	b = ( 1 - np.cos( 2 * math.pi * v ) ) / 2  # 0 등 → 1 배
	col = np.where( ( b < 0.5 )[ :, None ], BACK + ( SIDE - BACK ) * ( b / 0.5 )[ :, None ], SIDE + ( BELLY - SIDE ) * ( ( b - 0.5 ) / 0.5 )[ :, None ] )
	img = np.repeat( col[ :, None, : ], TEX, axis = 1 )
	img *= ( 1 - 0.10 * u )[ None, :, None ]  # 꼬리 쪽이 조금 진하다
	im = Image.fromarray( np.clip( img, 0, 255 ).astype( np.uint8 ), 'RGB' )

	rnd = random.Random( 52 )
	over = Image.new( 'RGBA', ( TEX, TEX ), ( 0, 0, 0, 0 ) )
	d = ImageDraw.Draw( over )
	# 대왕고래의 얼룩무늬
	for _ in range( 260 ):
		x = rnd.uniform( 0.08, 0.86 ) * TEX
		vv = rnd.choice( ( rnd.uniform( 0.04, 0.42 ), rnd.uniform( 0.58, 0.96 ) ) )
		if x < 0.52 * TEX and 0.29 < vv < 0.71:
			continue  # 목주름 자리
		y = vv * TEX
		r = rnd.uniform( 1.5, 5 )
		light = rnd.random() < 0.6
		d.ellipse( ( x - r * 1.6, y - r, x + r * 1.6, y + r ), fill = ( 255, 222, 120, 110 ) if light else ( 190, 120, 20, 70 ) )
	# 목주름: 턱 끝에서 가슴지느러미 뒤까지 어두운 홈과 밝은 줄을 번갈아 촘촘하게 (수염고래의 표시)
	pleats = 24
	for k in range( pleats ):
		vv = 0.315 + k * 0.37 / ( pleats - 1 )  # 아래턱 한쪽 옆 → 배 → 반대쪽 옆
		off = abs( vv - 0.5 ) / 0.185  # 0 배 가운데 → 1 옆
		end = ( 0.50 - 0.12 * off * off ) * TEX  # 옆쪽 주름일수록 짧다
		chin = 0.5 + ( vv - 0.5 ) * 0.8  # 턱 끝에서는 조금 모인다
		pts = [ ( 0.012 * TEX, chin * TEX ), ( 0.10 * TEX, vv * TEX ), ( end, vv * TEX ) ]
		d.line( pts, fill = ( 168, 112, 24, 235 ), width = 3 )
		d.line( [ ( x, y + 3 ) for x, y in pts ], fill = ( 255, 246, 214, 190 ), width = 2 )
	# 입선: 주둥이 끝에서 뒤로 길게, 양쪽 (눈은 그리지 않는다). side -1은 v를 뒤집는다
	for side in ( 1, - 1 ):
		mv = lambda v: v if side > 0 else 1 - v
		mouth = [ ( 0.0, 0.33 ), ( 0.05, 0.315 ), ( 0.10, 0.305 ), ( 0.13, 0.29 ) ]
		d.line( [ ( a * TEX, mv( bb ) * TEX ) for a, bb in mouth ], fill = ( 110, 62, 8, 235 ), width = 4 )
	# 숨구멍
	for y in ( 0, TEX ):
		d.ellipse( ( 0.125 * TEX - 4, y - 3, 0.125 * TEX + 4, y + 3 ), fill = ( 150, 95, 15, 200 ) )
	im = Image.alpha_composite( im.convert( 'RGBA' ), over.filter( ImageFilter.GaussianBlur( 0.6 ) ) ).convert( 'RGB' )
	return im


# 등의 빛 문양: 등 한가운데의 반짝이는 육각별(✶) 하나 + 둘레의 작은 반짝임
# 텍스처에서 v(몸 둘레)가 u(몸 길이)보다 촘촘하게 펴지므로, 몸 위에서 동그랗게 보이도록 세로로 ASPECT배 늘려 그린다
ASPECT = 2.1
STAR = ( 0.40, 0.0, 24 )  # u, v, 바깥 반지름(px). 꼭짓점이 가늘어야 겹친 삼각형(✡)이 아니라 반짝임으로 보인다
STAR_INNER = 0.28
SPARKLES = [ ( 0.24, 0.05, 5 ), ( 0.30, - 0.07, 4 ), ( 0.34, 0.09, 3 ), ( 0.47, - 0.09, 3 ), ( 0.52, 0.06, 5 ), ( 0.58, - 0.05, 4 ), ( 0.66, 0.03, 4 ), ( 0.72, - 0.02, 3 ) ]


def star_points( x, y, r, points, inner, rot = 0.0 ):

	out = []
	for i in range( points * 2 ):
		a = rot + math.pi * i / points
		rr = r if i % 2 == 0 else r * inner
		out.append( ( x + math.cos( a ) * rr, y + math.sin( a ) * rr * ASPECT ) )
	return out


def emissive_texture():

	# 별이 등줄기(v=0=1)에 걸쳐 있어서, v -0.5 ~ 1.5 높이로 그린 뒤 0 ~ 1로 접는다
	half = TEX // 2
	im = Image.new( 'RGB', ( TEX, TEX * 2 ), ( 0, 0, 0 ) )
	d = ImageDraw.Draw( im )
	u, v, r = STAR
	x, y = u * TEX, ( v + 0.5 ) * TEX
	d.polygon( star_points( x, y, r, 6, STAR_INNER ), fill = ( 255, 236, 170 ) )  # 꼭짓점 하나가 머리 쪽을 본다
	d.ellipse( ( x - r * 0.3, y - r * 0.3 * ASPECT, x + r * 0.3, y + r * 0.3 * ASPECT ), fill = ( 255, 252, 236 ) )
	for u, v, r in SPARKLES:
		x, y = u * TEX, ( v + 0.5 ) * TEX
		d.polygon( star_points( x, y, r, 4, 0.3, - math.pi / 2 ), fill = ( 255, 230, 160 ) )
	halo = im.filter( ImageFilter.GaussianBlur( 7 ) )
	glow = im.filter( ImageFilter.GaussianBlur( 2.5 ) )
	tall = np.clip( np.asarray( im, float ) + np.asarray( glow, float ) * 0.7 + np.asarray( halo, float ) * 1.1, 0, 255 )
	# 밤바다에서도 금빛 고래로 보이게 몸 전체가 은은하게 빛난다 (등 쪽이 조금 더)
	vv = ( np.arange( TEX * 2 ) + 0.5 ) / TEX - 0.5
	back = ( 1 + np.cos( 2 * math.pi * vv ) ) / 2
	base = np.array( ( 62, 42, 8 ), float )[ None, None, : ] * ( 0.55 + 0.45 * back )[ :, None, None ]
	tall = np.maximum( tall, base )
	out = tall[ half: half + TEX ].copy()  # v 0 ~ 1
	out[ half: ] = np.maximum( out[ half: ], tall[ :half ] )  # v -0.5 ~ 0 → 0.5 ~ 1
	out[ :half ] = np.maximum( out[ :half ], tall[ half + TEX: ] )  # v 1 ~ 1.5 → 0 ~ 0.5
	return Image.fromarray( out.astype( np.uint8 ) )


def encode( im, fmt ):

	buf = io.BytesIO()
	if fmt == 'JPEG':
		im.save( buf, 'JPEG', quality = 88 )
	else:
		im.save( buf, 'PNG', optimize = True )
	return buf.getvalue()


# ---------------------------------------------------------------
# GLB 쓰기
# ---------------------------------------------------------------
def write_glb( path, pos, nrm, uv, idx, images ):

	pos = np.asarray( pos, np.float32 )
	nrm = np.asarray( nrm, np.float32 )
	uv = np.asarray( uv, np.float32 )
	ind = np.asarray( idx, np.uint16 ).reshape( - 1 )
	bin_ = bytearray()
	views = []

	def add( data, target = None ):
		while len( bin_ ) % 4:
			bin_.append( 0 )
		views.append( { 'buffer': 0, 'byteOffset': len( bin_ ), 'byteLength': len( data ), **( { 'target': target } if target else {} ) } )
		bin_.extend( data )
		return len( views ) - 1

	v_pos = add( pos.tobytes(), 34962 )
	v_nrm = add( nrm.tobytes(), 34962 )
	v_uv = add( uv.tobytes(), 34962 )
	v_ind = add( ind.tobytes(), 34963 )
	v_imgs = [ add( data ) for data, _ in images ]
	while len( bin_ ) % 4:
		bin_.append( 0 )

	gltf = {
		'asset': { 'version': '2.0', 'generator': 'from-whale tools/make_stella.py' },
		'scene': 0,
		'scenes': [ { 'nodes': [ 0 ] } ],
		'nodes': [ { 'name': 'Stella', 'mesh': 0 } ],
		'meshes': [ { 'name': 'Stella', 'primitives': [ { 'attributes': { 'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2 }, 'indices': 3, 'material': 0 } ] } ],
		'materials': [ {
			'name': 'Stella',
			'pbrMetallicRoughness': { 'baseColorTexture': { 'index': 0 }, 'metallicFactor': 0.0, 'roughnessFactor': 0.55 },
			'emissiveTexture': { 'index': 1 },
			'emissiveFactor': [ 1.0, 1.0, 1.0 ]
		} ],
		'samplers': [ { 'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 10497 } ],
		'textures': [ { 'sampler': 0, 'source': 0 }, { 'sampler': 0, 'source': 1 } ],
		'images': [ { 'bufferView': v, 'mimeType': mime } for v, ( _, mime ) in zip( v_imgs, images ) ],
		'accessors': [
			{ 'bufferView': v_pos, 'componentType': 5126, 'count': len( pos ), 'type': 'VEC3', 'min': pos.min( 0 ).tolist(), 'max': pos.max( 0 ).tolist() },
			{ 'bufferView': v_nrm, 'componentType': 5126, 'count': len( nrm ), 'type': 'VEC3' },
			{ 'bufferView': v_uv, 'componentType': 5126, 'count': len( uv ), 'type': 'VEC2' },
			{ 'bufferView': v_ind, 'componentType': 5123, 'count': len( ind ), 'type': 'SCALAR' }
		],
		'bufferViews': views,
		'buffers': [ { 'byteLength': len( bin_ ) } ]
	}
	js = json.dumps( gltf, separators = ( ',', ':' ) ).encode()
	js += b' ' * ( ( 4 - len( js ) % 4 ) % 4 )
	total = 12 + 8 + len( js ) + 8 + len( bin_ )
	path.parent.mkdir( parents = True, exist_ok = True )
	with open( path, 'wb' ) as f:
		f.write( struct.pack( '<III', 0x46546C67, 2, total ) )
		f.write( struct.pack( '<II', len( js ), 0x4E4F534A ) )
		f.write( js )
		f.write( struct.pack( '<II', len( bin_ ), 0x004E4942 ) )
		f.write( bin_ )


def main():

	m = Mesh()
	build_body( m )
	build_fins( m )
	nrm = normals( m.pos, m.idx, m.seams )
	images = [ ( encode( base_texture(), 'JPEG' ), 'image/jpeg' ), ( encode( emissive_texture(), 'PNG' ), 'image/png' ) ]
	write_glb( OUT, m.pos, nrm, m.uv, m.idx, images )
	print( f'{OUT.relative_to( OUT.parents[ 2 ] )}: {len( m.pos )} verts, {len( m.idx )} tris, {OUT.stat().st_size // 1024} KB' )


if __name__ == '__main__':
	main()
